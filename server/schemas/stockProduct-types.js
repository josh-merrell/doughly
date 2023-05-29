const getStockProductsSchema_query = {
  type: 'object',
  properties: {
    stockProductIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
    productName: { type: 'string' },
  },
};

const getStockProductSchema_params = {
  type: 'object',
  required: ['stockProductID'],
  properties: {
    stockProductID: { type: 'integer' },
  },
};

const newStockProductSchema_body = {
  type: 'object',
  required: ['recipeID', 'productName'],
  properties: {
    recipeID: { type: 'integer' },
    productName: { type: 'string' },
    yield: { type: 'integer' },
  },
};

const StockProductUpdateSchema_body = {
  type: 'object',
  properties: {
    productName: { type: 'string' },
    yield: { type: 'integer' },
  },
};

const StockProductUpdateSchema_params = {
  type: 'object',
  required: ['stockProductID'],
  properties: {
    stockProductID: { type: 'string' },
  },
};

const StockProductDeleteSchema_params = {
  type: 'object',
  required: ['stockProductID'],
  properties: {
    stockProductID: { type: 'string' },
  },
};

module.exports = {
  getStockProductsSchema_query,
  getStockProductSchema_params,
  newStockProductSchema_body,
  StockProductUpdateSchema_body,
  StockProductUpdateSchema_params,
  StockProductDeleteSchema_params,
};
