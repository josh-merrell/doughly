const getTaskItemsSchema_query = {
  type: 'object',
  properties: {
    taskItemIDs: { type: 'array', items: { type: 'integer' } },
    orderID: { type: 'string' },
    recipeID: { type: 'string' },
    status: { type: 'string', enum: ['created', 'inProgress', 'done', 'removed'] },
  },
};

const getTaskItemSchema_params = {
  type: 'object',
  required: ['taskItemID'],
  properties: {
    taskItemID: { type: 'string' },
  },
};

const newTaskItemSchema_body = {
  type: 'object',
  required: ['orderID', 'recipeID', 'quantity', 'unitIncome'],
  properties: {
    orderID: { type: 'integer' },
    recipeID: { type: 'integer' },
    quantity: { type: 'integer' },
    unitIncome: { type: 'number' },
  },
};

const TaskItemUpdateSchema_body = {
  type: 'object',
  properties: {
    unitIncome: { type: 'number' },
    quantity: { type: 'integer' },
    status: { type: 'string', enum: ['created', 'inProgress', 'done', 'removed'] },
  },
};

const TaskItemUpdateSchema_params = {
  type: 'object',
  required: ['taskItemID'],
  properties: {
    taskItemID: { type: 'string' },
  },
};

const TaskItemDeleteSchema_params = {
  type: 'object',
  required: ['taskItemID'],
  properties: {
    taskItemID: { type: 'string' },
  },
};

module.exports = {
  getTaskItemsSchema_query,
  getTaskItemSchema_params,
  newTaskItemSchema_body,
  TaskItemUpdateSchema_body,
  TaskItemUpdateSchema_params,
  TaskItemDeleteSchema_params,
};
