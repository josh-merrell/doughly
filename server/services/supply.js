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
    throw errorGen(`*supply-supplyCheckMoreDemand* Error getting available product stocks: ${productStocksError.message}`, 511, 'failSupabaseSelect', true, 3);
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
    throw errorGen(`*supply-supplyCheckMoreDemand* Error getting stockItems: ${stockItemsError.message}`, 511, 'failSupabaseSelect', true, 3);
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
      throw errorGen(`*supply-supplyCheckMoreDemand* Error getting order: ${orderError.message}`, 511, 'failSupabaseSelect', true, 3);
    }
    orderDates[orderID] = order[0].scheduledDeliveryTime;
  }
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
        throw errorGen(`*supply-supplyCheckMoreDemand* Error patching stockItem`, 515, 'cannotComplete', false, 3);
      }
      if (stockItems[i].stockItemID > 0) {
        global.logger.info({ message: `*supply-supplyCheckMoreDemand* New stockItem caused previously sufficient stockStatus of stockItem ID: ${stockItems[i].stockItemID} to be insufficient. Updated stockStatus.`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      }
    }
  }
  return newStockStatus;
};

// Checks current ingredient/tool inventory for a given recipe and returns 'sufficient' or 'insufficient'. If 'insufficient', returns list of ingredients/tools that are insufficient.
const supplyCheckRecipe = async (userID, authorization, recipeID) => {
  const { data: recipeIngredients, error: recipeIngredientsError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
  if (recipeIngredientsError) {
    throw errorGen(`*supply-supplyCheckRecipe* Error getting recipeIngredients: ${recipeIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
  }

  const { data: recipeTools, error: recipeToolsError } = await supabase.from('recipeTools').select('toolID, quantity').filter('recipeID', 'eq', recipeID).filter('deleted', 'eq', false);
  if (recipeToolsError) {
    throw errorGen(`*supply-supplyCheckRecipe* Error getting recipeTools: ${recipeToolsError.message}`, 511, 'failSupabaseSelect', true, 3);
  }

  const { data: recipe, error: recipeError } = await supabase.from('recipes').select('recipeID, title').filter('recipeID', 'eq', recipeID);
  if (recipeError) {
    throw errorGen(`*supply-supplyCheckRecipe* Error getting recipe: ${recipeError.message}`, 511, 'failSupabaseSelect', true, 3);
  }

  const insufficientIngredients = [];
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the associated ingredient 'gramRatio' for the recipeIngredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio, name').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      throw errorGen(`*supply-supplyCheckRecipe* Error getting ingredient: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
    }
    let gramsNeeded = recipeIngredients[i].measurement * recipeIngredients[i].purchaseUnitRatio * ingredient.gramRatio;
    const { data: ingredientStock, error: ingredientStockError } = await supabase.from('ingredientStocks').select('ingredientID, grams').filter('userID', 'eq', userID).filter('ingredientID', 'eq', recipeIngredients[i].ingredientID);
    if (ingredientStockError) {
      throw errorGen(`*supply-supplyCheckRecipe* Error getting ingredientStock: ${ingredientStockError.message}`, 511, 'failSupabaseSelect', true, 3);
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
      throw errorGen(`*supply-supplyCheckRecipe* Error getting toolStock: ${toolStockError.message}`, 511, 'failSupabaseSelect', true, 3);
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

const supplyCheckRecipeIngredient = async (userID, authorization, ingredientID, recipeID) => {
  global.logger.info({ message: `*supply-supplyCheckRecipeIngredient* IN supplyCheckRecipeIngredient: userID: ${userID}, ingredientID: ${ingredientID}, recipeID: ${recipeID}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
  const { data: recipeIngredient, error: recipeIngredientError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID).filter('ingredientID', 'eq', ingredientID);
  if (recipeIngredientError) {
    throw errorGen(`*supply-supplyCheckRecipeIngredient* Error getting recipeIngredient: ${recipeIngredientError.message}`, 511, 'failSupabaseSelect', true, 3);
  }

  const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio, name').filter('ingredientID', 'eq', ingredientID).single();
  if (ingredientError) {
    throw errorGen(`*supply-supplyCheckRecipeIngredient* Error getting ingredient: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
  }
  let gramsNeeded = recipeIngredient[0].measurement * recipeIngredient[0].purchaseUnitRatio * ingredient.gramRatio;
  // global.logger.info(`gramsNeeded: ${gramsNeeded}`);
  global.logger.info({ message: `*supply-supplyCheckRecipeIngredient* gramsNeeded: ${gramsNeeded}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
  const { data: ingredientStock, error: ingredientStockError } = await supabase.from('ingredientStocks').select('ingredientID, grams').filter('userID', 'eq', userID).filter('ingredientID', 'eq', ingredientID).filter('deleted', 'eq', false);
  if (ingredientStockError) {
    throw errorGen(`*supply-supplyCheckRecipeIngredient* Error getting ingredientStock: ${ingredientStockError.message}`, 511, 'failSupabaseSelect', true, 3);
  }
  for (let j = 0; j < ingredientStock.length; j++) {
    global.logger.info({ message: `*supply-supplyCheckRecipeIngredient* ingredientStock[j].grams: ${ingredientStock[j].grams}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
    if (ingredientStock[j].grams >= gramsNeeded) {
      gramsNeeded = 0;
      break;
    }
    gramsNeeded -= ingredientStock[j].grams;
  }

  if (gramsNeeded > 0) {
    return { status: 'insufficient', ingredientName: ingredient.name, ingredientID: ingredientID, quantity: gramsNeeded };
  } else {
    return { status: 'sufficient', ingredientName: ingredient.name };
  }
};

// Uses ingredient inventory for a given recipe
const useRecipeIngredients = async (userID, authorization, recipeID) => {
  const deletedIngredientStocks = [];
  //get all recipeIngredients for the recipe
  const { data: recipeIngredients, error: recipeIngredientsError } = await supabase.from('recipeIngredients').select('ingredientID, measurement, purchaseUnitRatio').filter('recipeID', 'eq', recipeID);
  if (recipeIngredientsError) {
    throw errorGen(`*supply-useRecipeIngredient* Error getting recipeIngredients: ${recipeIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
  }

  //for each
  for (let i = 0; i < recipeIngredients.length; i++) {
    //get the 'gramRatio' from the associated ingredient
    const { data: ingredient, error: ingredientError } = await supabase.from('ingredients').select('gramRatio').filter('ingredientID', 'eq', recipeIngredients[i].ingredientID).single();
    if (ingredientError) {
      throw errorGen(`*supply-useRecipeIngredient* Error getting ingredient: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
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
      throw errorGen(`*supply-useRecipeIngredient* Error getting ingredientStocks: ${ingredientStocksError.message}`, 511, 'failSupabaseSelect', true, 3);
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

          throw errorGen(
            err.message || `*supply-useRecipeIngredient* Error patching ingredientStock: ${patchIngredientStockError.message}`,
            patchIngredientStockError.code || 520,
            patchIngredientStockError.name || 'cannotComplete',
            patchIngredientStockError.isOperational || false,
            patchIngredientStockError.severity || 2,
          ); //message, code, name, operational, severitypatchIngredientStockError
        }
        break;
      } else {
        neededGrams -= ingredientStocks[j].grams;
        //delete the ingredientStock using axios call to /ingredientStocks/:ingredientStockID, providing authorization as a header
        const { error: deleteIngredientStockError } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/${ingredientStocks[j].ingredientStockID}`, { headers: { authorization } });
        if (deleteIngredientStockError) {
          const rollback = await rollbackDeletedIngredientStocks(userID, authorization, deletedIngredientStocks);
          throw errorGen(`*supply-useRecipeIngredient* Error deleting ingredientStock: ${deleteIngredientStockError.message}`, 514, 'failSupabaseDelete', true, 3);
        }
        deletedIngredientStocks.push(ingredientStocks[j].ingredientStockID);
      }
    }
    // also need to check for low stock and send a notification if stock is low/empty. Include 'ingredientID' in the body of the request
    const { error: checkLowStockError } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/ingredientStocks/checkForLowStock`, { userID, ingredientID: recipeIngredients[i].ingredientID }, { headers: { authorization } });
    if (checkLowStockError) {
      throw errorGen(err.message || `*supply-useRecipeIngredient* Error checking low stock: ${checkLowStockError.message}`, checkLowStockError.code || 520, checkLowStockError.name || 'cannotComplete', checkLowStockError.isOperational || false, checkLowStockError.severity || 2); //message, code, name, operational, severitycheckLowStockError
    }
  }
  return { success: true };
};

const rollbackDeletedIngredientStocks = async (userID, authorization, deletedIngredientStocks) => {
  //for each deletedIngredientStock, make a direct supabase call to update the deleted flag to false
  for (let i = 0; i < deletedIngredientStocks.length; i++) {
    const { error: updateIngredientStockError } = await supabase.from('ingredientStocks').update({ deleted: false }).eq('ingredientStockID', deletedIngredientStocks[i]);
    if (updateIngredientStockError) {
      throw errorGen(`*supply-rollbackDeletedIngredientStocks* Error updating ingredientStock: ${updateIngredientStockError.message}`, 513, 'failSupabaseUpdate', true, 3);
    }

    //log the rollback
    await createKitchenLog(userID, authorization, 'rollbackIngredientStockDelete', deletedIngredientStocks[i], null, null, null, `Rollback of deleted ingredientStockID: ${deletedIngredientStocks[i]}`);
  }
  return { success: true };
};

module.exports = {
  supplyCheckMoreDemand,
  supplyCheckRecipe,
  supplyCheckRecipeIngredient,
  useRecipeIngredients,
};
