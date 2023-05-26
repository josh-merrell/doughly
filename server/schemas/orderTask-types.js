const getOrdersTasksSchema_query = {
  type: 'object',
  properties: {
    orderTaskIDs: { type: 'array', items: { type: 'integer' } },
    orderID: { type: 'string' },
    recipeID: { type: 'string' },
    status: { type: 'string', enum: ['created', 'inProgress', 'done', 'removed'] },
  },
};

const getOrderTaskSchema_params = {
  type: 'object',
  required: ['orderTaskID'],
  properties: {
    orderTaskID: { type: 'string' },
  },
};

const newOrderTaskSchema_body = {
  type: 'object',
  required: ['orderID', 'recipeID', 'quantity', 'unitIncome'],
  properties: {
    orderID: { type: 'integer' },
    recipeID: { type: 'integer' },
    quantity: { type: 'integer' },
    unitIncome: { type: 'number' },
  },
};

const OrderTaskUpdateSchema_body = {
  type: 'object',
  properties: {
    unitIncome: { type: 'number' },
    quantity: { type: 'integer' },
    status: { type: 'string', enum: ['created', 'inProgress', 'done', 'removed'] },
  },
};

const OrderTaskUpdateSchema_params = {
  type: 'object',
  required: ['orderTaskID'],
  properties: {
    orderTaskID: { type: 'string' },
  },
};

const OrderTaskDeleteSchema_params = {
  type: 'object',
  required: ['orderTaskID'],
  properties: {
    orderTaskID: { type: 'string' },
  },
};

module.exports = {
  getOrdersTasksSchema_query,
  getOrderTaskSchema_params,
  newOrderTaskSchema_body,
  OrderTaskUpdateSchema_body,
  OrderTaskUpdateSchema_params,
  OrderTaskDeleteSchema_params,
};
