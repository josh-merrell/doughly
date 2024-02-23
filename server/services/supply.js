const { supabase } = require('../db.js');
const { default: axios } = require('axios');
const { createKitchenLog } = require('./dbLogger.js');
const { errorGen } = require('../middleware/errorHandling.js');

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
    global.logger.error(`'supplyCheckMoreDemand' Error getting available product stocks: ${productStocksError.message}`);
    throw errorGen(`'supplyCheckMoreDemand' Error getting available product stocks`, 400);
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
    global.logger.error(`'supplyCheckMoreDemand' Error getting stockItems: ${stockItemsError.message}`);
    throw errorGen(`'supplyCheckMoreDemand' Error getting stockItems`, 400);
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
      global.logger.error(`'supplyCheckMoreDemand' Error getting order: ${orderError.message}`);
      throw errorGen(`'supplyCheckMoreDemand' Error getting order`, 400);
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
        global.logger.error(`'supplyCheckMoreDemand' Error patching stockItem: ${patchStockItemError.message}`);
        // return { error: patchStockItemError.message };
        throw errorGen(`'supplyCheckMoreDemand' Error patching stockItem`, 400);
      }
      if (stockItems[i].stockItemID > 0) global.logger.info(`New stockItem caused previously sufficient stockStatus of stockItem ID: ${stockItems[i].stockItemID} to be insufficient. Updated stockStatus.`);
    }
  }
  return newStockStatus;
};

// Checks current ingredient/tool inventory for a given recipe and returns 'sufficient' or 'insufficient'. If 'insufficient', returns list of ingredients/tools that are insufficient.
const supplyCheckRecipe = async (userID, authorization, recipeID) => {
  console.log();
  const { data: recipeIngredients, error: recipeIngredientsError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
  if (recipeIngredientsError) {
    global.logger.error(`'supplyCheckRecipe' Error getting recipeIngredients: ${recipeIngredientsError.message}`);
    throw errorGen(`'supplyCheckRecipe' Error getting recipeIngredients`, 400);
  }

  const { data: recipeTools, error: recipeToolsError } = await supabase.from('recipeTools').select('toolID, quantity').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
  if (recipeToolsError) {
    global.logger.error(`'supplyCheckRecipe' Error getting recipeTools: ${recipeToolsError.message}`);
    throw errorGen(`'supplyCheckRecipe' Error getting recipeTools`, 400);
  }

  const { data: recipe, error: recipeError } = await supabase.from('recipes').select('recipeID, title').filter('recipeID', 'eq', recipeID);
  if (recipeError) {
    global.logger.error(`'supplyCheckRecipe' Error getting recipe: ${recipeError.message}`);
    throw errorGen(`'supplyCheckRecipe' Error getting recipe`, 400);
  }

  const insufficientIngredients = [];
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the associated ingredient 'gramRatio' for the recipeIngredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio, name').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      global.logger.error(`'supplyCheckRecipe' Error getting ingredient: ${ingredientError.message}`);
      throw errorGen(`'supplyCheckRecipe' Error getting ingredient`, 400);
    }
    let gramsNeeded = recipeIngredients[i].measurement * (ingredient.gramRatio / recipeIngredients[i].purchaseUnitRatio);
    const { data: ingredientStock, error: ingredientStockError } = await supabase.from('ingredientStocks').select('ingredientID, grams').filter('userID', 'eq', userID).filter('ingredientID', 'eq', recipeIngredients[i].ingredientID);
    if (ingredientStockError) {
      global.logger.error(`'supplyCheckRecipe' Error getting ingredientStock: ${ingredientStockError.message}`);
      throw errorGen(`'supplyCheckRecipe' Error getting ingredientStock`, 400);
    }
    for (let j = 0; j < ingredientStock.length; j++) {
      if (ingredientStock[j].grams >= gramsNeeded) {
        gramsNeeded = 0;
        break;
      }
      gramsNeeded -= ingredientStock[j].grams;
    }

    if (gramsNeeded > 0) {
      insufficientIngredients.push({ ingredientName: ingredient.name, ingredientID: recipeIngredients[i].ingredientID, quantity: gramsNeeded });
    }
  }

  const insufficientTools = [];
  for (let i = 0; i < recipeTools.length; i++) {
    if (recipeTools[i].quantity === -1) continue;
    const { data: toolStock, error: toolStockError } = await supabase.from('toolStocks').select('toolID').filter('userID', 'eq', userID).filter('toolID', 'eq', recipeTools[i].toolID);
    if (toolStockError) {
      global.logger.error(`'supplyCheckRecipe' Error getting toolStock: ${toolStockError.message}`);
      throw errorGen(`'supplyCheckRecipe' Error getting toolStock`, 400);
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
    global.logger.error(`'useRecipeIngredients' Error getting recipeIngredients: ${recipeIngredientsError.message}`);
    throw errorGen(`'useRecipeIngredients' Error getting recipeIngredients`, 400);
  }

  //for each
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the 'gramRatio' from the associated ingredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      global.logger.error(`'useRecipeIngredients' Error getting ingredient: ${ingredientError.message}`);
      throw errorGen(`'useRecipeIngredients' Error getting ingredient`, 400);
    }
    //calculate the neededGrams by multiplying recipeIngredient.measurement * recipeIngredient.purchaseUnitRatio * ingredient.gramRatio
    let neededGrams = recipeIngredients[i].measurement * (ingredient.gramRatio / recipeIngredients[i].purchaseUnitRatio);
    //get all non-deleted ingredientStocks for the ingredient, ordered by purchasedDate ascending
    const { data: ingredientStocks, error: ingredientStocksError } = await supabase
      .from('ingredientStocks')
      .select('ingredientStockID, ingredientID, grams, purchasedDate')
      .filter('userID', 'eq', userID)
      .filter('ingredientID', 'eq', recipeIngredients[i].ingredientID)
      .filter('deleted', 'eq', false)
      .order('purchasedDate', { ascending: true });
    if (ingredientStocksError) {
      global.logger.error(`'useRecipeIngredients' Error getting ingredientStocks: ${ingredientStocksError.message}`);
      throw errorGen(`'useRecipeIngredients' Error getting ingredientStocks. rollbackSuccess: true`, 400);
    }
    //if stock grams >= neededGrams, subtract neededGrams from stock grams, update the db entry, and break. Otherwise, subtract stock grams from neededGrams, delete the stock and continue to next ingredientStock.
    for (let j = 0; j < ingredientStocks.length; j++) {
      if (ingredientStocks[j].grams >= neededGrams) {
        //update the stock grams using axios call to /ingredientStocks/:ingredientStockID, providing 'newMeasurement' body param, authorization should be a header
        const { error: patchIngredientStockError } = await axios.patch(
          `${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${ingredientStocks[j].ingredientStockID}`,
          {
            userID: userID,
            grams: Math.floor(ingredientStocks[j].grams - neededGrams),
          },
          {
            headers: {
              authorization,
            },
          },
        );
        if (patchIngredientStockError) {
          const rollback = await rollbackDeletedIngredientStocks(userID, authorization, deletedIngredientStocks);
          global.logger.error(`'useRecipeIngredients' Error patching ingredientStock: ${patchIngredientStockError.message}`);
          throw errorGen(`'useRecipeIngredients' Error patching ingredientStock. rollbackSuccess: ${rollback.success}`, 400);
        }
        break;
      } else {
        neededGrams -= ingredientStocks[j].grams;
        //delete the ingredientStock using axios call to /ingredientStocks/:ingredientStockID, providing authorization as a header
        const { error: deleteIngredientStockError } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${ingredientStocks[j].ingredientStockID}`, { headers: { authorization } });
        if (deleteIngredientStockError) {
          const rollback = await rollbackDeletedIngredientStocks(userID, authorization, deletedIngredientStocks);
          global.logger.error(`'useRecipeIngredients' Error deleting ingredientStock: ${deleteIngredientStockError.message}`);
          throw errorGen(`'useRecipeIngredients' Error deleting ingredientStock. rollbackSuccess: ${rollback.success}`, 400);
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
      global.logger.error(`'rollbackDeletedIngredientStocks' Error updating ingredientStock: ${updateIngredientStockError.message}`);
      throw errorGen(`'rollbackDeletedIngredientStocks' Error updating ingredientStock`, 400);
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
