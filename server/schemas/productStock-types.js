const getProductStocksSchema_query = {
  type: 'object',
  properties: {
    productStockIDs: { type: 'array', items: { type: 'integer' } },
    stockProductID: { type: 'string' },
    producedDate: { type: 'string' },
    daysRemaining: { type: 'string' },
    status: { type: 'string', enum: ['fresh', 'expired'] },
  },
};

const getProductStockSchema_params = {
  type: 'object',
  required: ['productStockID'],
  properties: {
    productStockID: { type: 'string' },
  },
};

const newProductStockSchema_body = {
  type: 'object',
  required: ['stockProductID', 'producedDate'],
  properties: {
    stockProductID: { type: 'integer' },
    producedDate: { type: 'string' },
  },
};

const ProductStockUpdateSchema_body = {
  type: 'object',
  properties: {
    producedDate: { type: 'string' },
    daysRemaining: { type: 'integer' },
    status: { type: 'string', enum: ['fresh', 'expired'] },
  },
};

const ProductStockUpdateSchema_params = {
  type: 'object',
  required: ['productStockID'],
  properties: {
    productStockID: { type: 'string' },
  },
};

const ProductStockDeleteSchema_params = {
  type: 'object',
  required: ['productStockID'],
  properties: {
    productStockID: { type: 'string' },
  },
};

module.exports = {
  getProductStocksSchema_query,
  getProductStockSchema_params,
  newProductStockSchema_body,
  ProductStockUpdateSchema_body,
  ProductStockUpdateSchema_params,
  ProductStockDeleteSchema_params,
};
