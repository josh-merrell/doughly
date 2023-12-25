const { supabase } = require('../db.js');
const { default: axios } = require('axios');
const { createKitchenLog } = require('./dbLogger.js');

/**
Provides currently-accurate stock status for a given order.

in: 
  - neededQuantity
  - stockProductID
  - scheduledDeliveryTime
out:
  - status ['sufficient', 'insufficient']

**/
const supplyCheckMoreDemand = async (userID, neededQuantity, orderID, stockProductID, scheduledDeliveryTimeString, stockItemID) => {
  //retrieve available stock, find all rows in productStocks table with matching stockProductID
  const { data: productStocks, error: productStocksError } = await supabase.from('productStocks').select('productStockID, daysRemaining').filter('userID', 'eq', userID).filter('stockProductID', 'eq', stockProductID);
  if (productStocksError) {
    global.logger.info(`Error getting available product stocks: ${productStocksError.message}`);
    return { error: productStocksError.message };
  }
  if (!productStocks.length) {
    //if no available stock, return 'insufficient'
    return 'insufficient';
  }
  //order the productStocks by daysRemaining ascending
  productStocks.sort((a, b) => a.daysRemaining - b.daysRemaining);
  //retrieve all stockItemIDs that share the stockProductID.
  //Then retrieve all orders associated with those stockItemIDs. Use order column 'scheduledDeliveryTime' to order the stockItemIDs by date.
  const { data: stockItems, error: stockItemsError } = await supabase.from('orderStockItems').select('stockItemID, quantity, orderID, stockStatus').filter('userID', 'eq', userID).filter('stockProductID', 'eq', stockProductID);
  if (stockItemsError) {
    global.logger.info(`Error getting stockItems: ${stockItemsError.message}`);
    return { error: stockItemsError.message };
  }
  //if stockItemID is is not provided (new Item), add temp entry to stockItems array.
  if (!stockItemID) {
    stockItems.push({ stockItemID: 0, quantity: neededQuantity, stockStatus: 'sufficient', orderID: orderID });
  }
  //collect list of orderIds from stockItems
  const orderIDs = [...new Set(stockItems.map((stockItem) => stockItem.orderID))];
  const orderDates = {};
  for (const orderID of orderIDs) {
    const { data: order, error: orderError } = await supabase.from('orders').select('scheduledDeliveryTime').filter('userID', 'eq', userID).filter('orderID', 'eq', orderID);
    if (orderError) {
      global.logger.info(`Error getting order: ${orderError.message}`);
      return { error: orderError.message };
    }
    orderDates[orderID] = order[0].scheduledDeliveryTime;
  }
  // console.log(`ORDER DATES: ${JSON.stringify(orderDates)}`);
  let newStockStatus = 'insufficient';
  //sort stockItems by scheduledDeliveryTime ascending, then by stockItemID
  stockItems.sort((a, b) => {
    if (orderDates[a.orderID] === orderDates[b.orderID]) {
      return a.stockItemID - b.stockItemID;
    } else {
      return new Date(orderDates[a.orderID]) - new Date(orderDates[b.orderID]);
    }
  });
  // console.log(`ITEMS INCLUDING NEW, SORTED: ${JSON.stringify(stockItems)}`);
  //start stockIndex at 0. Iterate through stockItems, checking whether enough unexpired stock is available for the stockItem.
  //If current 'stockStatus' of stockItem is 'insufficient', just return the current 'newStockStatus'. Otherwise, if there is enough stock for this stockItem,
  //add 'quantity' to 'stockIndex' and update newStockStatus to 'sufficient' if this is the correct stockItemID. If we find that available stock is insufficinet for current
  // stockItem, need to make PATCH /orders/items/stock/{stockItemID} request to update stockStatus to 'insufficient' for this and all remaining stockItemIDs with
  //stockStatus of 'sufficient'.

  let stockIndex = 0;
  let currStockItemInd = 0;
  while (currStockItemInd < stockItems.length) {
    if (stockItems[currStockItemInd].stockStatus === 'insufficient') return newStockStatus;
    stockIndex += stockItems[currStockItemInd].quantity;
    const daysUntilNeedByDate = Math.ceil((new Date(orderDates[stockItems[currStockItemInd].orderID]) - Date.now()) / (1000 * 60 * 60 * 24));
    if (productStocks[stockIndex - 1] && productStocks[stockIndex - 1].daysRemaining >= daysUntilNeedByDate) {
      if (stockItems[currStockItemInd].stockItemID === 0) {
        newStockStatus = 'sufficient';
      }
    } else break;
    currStockItemInd++;
  }
  //if currStockItemInd is less than stockItems.length, then there is insufficient stock for the current stockItem and all remaining stockItems.
  //Need to make PATCH /orders/items/stock/{stockItemID} request to update stockStatus to 'insufficient' for this and all remaining stockItemIDs with stockStatus of 'sufficient'.
  if (currStockItemInd < stockItems.length) {
    for (let i = currStockItemInd; i < stockItems.length; i++) {
      if (stockItems[i].stockStatus === 'insufficient') {
        break;
      }
      const { error: patchStockItemError } = await supabase.from('orderStockItems').update({ stockStatus: 'insufficient' }).eq('stockItemID', stockItems[i].stockItemID);
      if (patchStockItemError) {
        global.logger.info(`Error patching stockItem: ${patchStockItemError.message}`);
        return { error: patchStockItemError.message };
      }
      if (stockItems[i].stockItemID > 0) global.logger.info(`New stockItem caused previously sufficient stockStatus of stockItem ID: ${stockItems[i].stockItemID} to be insufficient. Updated stockStatus.`);
    }
  }
  return newStockStatus;
};

// Checks current ingredient/tool inventory for a given recipe and returns 'sufficient' or 'insufficient'. If 'insufficient', returns list of ingredients/tools that are insufficient.
const supplyCheckRecipe = async (userID, authorization, recipeID) => {
  const { data: recipeIngredients, error: recipeIngredientsError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID);
  if (recipeIngredientsError) {
    global.logger.info(`Error getting recipeIngredients: ${recipeIngredientsError.message}`);
    return { error: recipeIngredientsError.message };
  }

  const { data: recipeTools, error: recipeToolsError } = await supabase.from('recipeTools').select('toolID, quantity').filter('recipeID', 'eq', recipeID);
  if (recipeToolsError) {
    global.logger.info(`Error getting recipeTools: ${recipeToolsError.message}`);
    return { error: recipeToolsError.message };
  }

  const { data: recipe, error: recipeError } = await supabase.from('recipes').select('recipeID, title').filter('recipeID', 'eq', recipeID);
  if (recipeError) {
    global.logger.info(`Error getting recipe: ${recipeError.message}`);
    return { error: recipeError.message };
  }

  const insufficientIngredients = [];
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the associated ingredient 'gramRatio' for the recipeIngredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      global.logger.info(`Error getting ingredient: ${ingredientError.message}`);
      return { error: ingredientError.message };
    }
    let gramsNeeded = recipeIngredients[i].measurement * recipeIngredients[i].purchaseUnitRatio * ingredient.gramRatio;
    const { data: ingredientStock, error: ingredientStockError } = await supabase.from('ingredientStocks').select('ingredientID, grams').filter('userID', 'eq', userID).filter('ingredientID', 'eq', recipeIngredients[i].ingredientID);
    if (ingredientStockError) {
      global.logger.info(`Error getting ingredientStock: ${ingredientStockError.message}`);
      return { error: ingredientStockError.message };
    }
    for (let j = 0; j < ingredientStock.length; j++) {
      if (ingredientStock[j].grams >= gramsNeeded) {
        gramsNeeded = 0;
        break;
      }
      gramsNeeded -= ingredientStock[j].grams;
    }

    if (gramsNeeded > 0) {
      insufficientIngredients.push({ ingredientID: recipeIngredients[i].ingredientID, quantity: gramsNeeded });
    }
  }

  const insufficientTools = [];
  for (let i = 0; i < recipeTools.length; i++) {
    const { data: toolStock, error: toolStockError } = await supabase.from('toolStocks').select('toolID').filter('userID', 'eq', userID).filter('toolID', 'eq', recipeTools[i].toolID);
    if (toolStockError) {
      global.logger.info(`Error getting toolStock: ${toolStockError.message}`);
      return { error: toolStockError.message };
    }
    if (toolStock.length < recipeTools[i].quantity) {
      insufficientTools.push({ toolID: recipeTools[i].toolID, quantityNeeded: recipeTools[i].quantity });
    }
  }

  if (insufficientIngredients.length || insufficientTools.length) {
    return { data: { status: 'insufficient', recipeName: recipe.title, insufficientIngredients: insufficientIngredients, insufficientTools: insufficientTools } };
  } else {
    return { data: { status: 'sufficient', recipeName: recipe.title } };
  }
};

// Uses ingredient inventory for a given recipe
const useRecipeIngredients = async (userID, authorization, recipeID) => {
  const deletedIngredientStocks = [];
  //get all recipeIngredients for the recipe
  const { data: recipeIngredients, error: recipeIngredientsError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID);
  if (recipeIngredientsError) {
    global.logger.info(`Error getting recipeIngredients: ${recipeIngredientsError.message}`);
    return { error: recipeIngredientsError.message, rollbackSuccess: true };
  }

  //for each
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the 'gramRatio' from the associated ingredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      global.logger.info(`Error getting ingredient: ${ingredientError.message}`);
      return { error: ingredientError.message, rollbackSuccess: true };
    }
    //calculate the neededGrams by multiplying recipeIngredient.measurement * recipeIngredient.purchaseUnitRatio * ingredient.gramRatio
    let neededGrams = recipeIngredients[i].measurement * recipeIngredients[i].purchaseUnitRatio * ingredient.gramRatio;
    //get all non-deleted ingredientStocks for the ingredient, ordered by purchasedDate ascending
    const { data: ingredientStocks, error: ingredientStocksError } = await supabase
      .from('ingredientStocks')
      .select('ingredientStockID, ingredientID, grams, purchasedDate')
      .filter('userID', 'eq', userID)
      .filter('ingredientID', 'eq', recipeIngredients[i].ingredientID)
      .filter('deleted', 'eq', false)
      .order('purchasedDate', { ascending: true });
    if (ingredientStocksError) {
      global.logger.info(`Error getting ingredientStocks: ${ingredientStocksError.message}`);
      return { error: ingredientStocksError.message, rollbackSuccess: true };
    }
    //if stock grams >= neededGrams, subtract neededGrams from stock grams, update the db entry, and break. Otherwise, subtract stock grams from neededGrams, delete the stock and continue to next ingredientStock.
    for (let j = 0; j < ingredientStocks.length; j++) {
      if (ingredientStocks[j].grams >= neededGrams) {
        //calculate new measurement for the updated ingredientStock
        const newMeasurement = (ingredientStocks[j].grams - neededGrams) / ingredient.gramRatio;
        //update the stock grams using axios call to /ingredientStocks/:ingredientStockID, providing 'newMeasurement' body param, authorization should be a header
        const { error: patchIngredientStockError } = await axios.patch(
          `${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${ingredientStocks[j].ingredientStockID}`,
          {
            userID: userID,
            measurement: newMeasurement,
          },
          {
            headers: {
              authorization,
            },
          },
        );
        if (patchIngredientStockError) {
          global.logger.info(`Error patching ingredientStock: ${patchIngredientStockError.message}`);
          const rollback = await rollbackDeletedIngredientStocks(userID, authorization, deletedIngredientStocks);
          return { error: patchIngredientStockError.message, rollbackSuccess: rollback.success };
        }
        break;
      } else {
        neededGrams -= ingredientStocks[j].grams;
        //delete the ingredientStock using axios call to /ingredientStocks/:ingredientStockID, providing authorization as a header
        const { error: deleteIngredientStockError } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${ingredientStocks[j].ingredientStockID}`, { headers: { authorization } });
        if (deleteIngredientStockError) {
          global.logger.info(`Error deleting ingredientStock: ${deleteIngredientStockError.message}`);
          const rollback = await rollbackDeletedIngredientStocks(userID, authorization, deletedIngredientStocks);
          return { error: deleteIngredientStockError.message, rollbackSuccess: rollback.success };
        }
        deletedIngredientStocks.push(ingredientStocks[j].ingredientStockID);
      }
    }
  }
  return { success: true };
};

const rollbackDeletedIngredientStocks = async (userID, authorization, deletedIngredientStocks) => {
  //for each deletedIngredientStock, make a direct supabase call to update the deleted flag to false
  for (let i = 0; i < deletedIngredientStocks.length; i++) {
    const { error: updateIngredientStockError } = await supabase.from('ingredientStocks').update({ deleted: false }).eq('ingredientStockID', deletedIngredientStocks[i]);
    if (updateIngredientStockError) {
      global.logger.info(`Error updating ingredientStock: ${updateIngredientStockError.message}`);
      return { error: updateIngredientStockError.message, success: false };
    }

    //log the rollback
    await createKitchenLog(userID, authorization, 'rollbackIngredientStockDelete', deletedIngredientStocks[i], null, null, null, `Rollback of deleted ingredientStockID: ${deletedIngredientStocks[i]}`);
  }
  return { success: true };
};

module.exports = {
  supplyCheckMoreDemand,
  supplyCheckRecipe,
  useRecipeIngredients,
};
