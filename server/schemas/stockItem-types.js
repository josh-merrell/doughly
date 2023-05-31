const getStockItemsSchema_query = {
  type: 'object',
  properties: {
    stockItemIDs: { type: 'array', items: { type: 'integer' } },
    orderID: { type: 'string' },
    stockProductID: { type: 'string' },
    stockStatus: { type: 'string', enum: ['sufficient', 'insufficient'] },
  },
};

const getStockItemSchema_params = {
  type: 'object',
  required: ['stockItemID'],
  properties: {
    stockItemID: { type: 'string' },
  },
};

const newStockItemsSchema_body = {
  type: 'object',
  required: ['orderID', 'stockProductID', 'quantity', 'unitIncome'],
  properties: {
    orderID: { type: 'integer' },
    stockProductID: { type: 'integer' },
    quantity: { type: 'integer' },
    unitIncome: { type: 'number' },
  },
};

const StockItemsUpdateSchema_body = {
  type: 'object',
  properties: {
    unitIncome: { type: 'number' },
    quantity: { type: 'integer' },
    stockStatus: { type: 'string', enum: ['sufficient', 'insufficient'] },
  },
};

const StockItemsUpdateSchema_params = {
  type: 'object',
  required: ['stockItemID'],
  properties: {
    stockItemID: { type: 'string' },
  },
};

const StockItemsDeleteSchema_params = {
  type: 'object',
  required: ['stockItemID'],
  properties: {
    stockItemID: { type: 'string' },
  },
};

module.exports = {
  getStockItemsSchema_query,
  getStockItemSchema_params,
  newStockItemsSchema_body,
  StockItemsUpdateSchema_body,
  StockItemsUpdateSchema_params,
  StockItemsDeleteSchema_params,
};
