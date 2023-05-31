/**

in: 
  - neededQuantity
  - stockProductID
  - scheduledDeliveryTime
out:
  - status ['sufficient', 'insufficient']

**/

const { supabase } = require('../db.js');

const supplyCheckMoreDemand = async (neededQuantity, orderID, stockProductID, scheduledDeliveryTimeString, stockItemID) => {
  //retrieve available stock, find all rows in productStocks table with matching stockProductID
  const { data: productStocks, error: productStocksError } = await supabase.from('productStocks').select('productStockID, daysRemaining').eq('stockProductID', stockProductID);
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
  const { data: stockItems, error: stockItemsError } = await supabase
    .from('orderStockItems')
    .select('stockItemID, quantity, orderID, stockStatus')
    .eq('stockProductID', stockProductID);
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
    const { data: order, error: orderError } = await supabase.from('orders').select('scheduledDeliveryTime').eq('orderID', orderID);
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
      if (stockItems[i].stockItemID > 0)
        global.logger.info(`New stockItem caused previously sufficient stockStatus of stockItem ID: ${stockItems[i].stockItemID} to be insufficient. Updated stockStatus.`);
    }
  }
  return newStockStatus;
};

module.exports = {
  supplyCheckMoreDemand,
};
