const getShoppingListSchema_params = {
  type: 'object',
  required: ['shoppingListID'],
  properties: {
    shoppingListID: { type: 'string' },
  },
};

const getShoppingListsSchema_query = {
  type: 'object',
  properties: {
    shoppingListIDs: { type: 'array', items: { type: 'integer' } },
  },
};

const ShoppingListUpdateSchema_body = {
  type: 'object',
  properties: {
    status: { type: 'string' },
    fulfilledDate: { type: 'string' },
    fulfilledMethod: { type: 'string' },
    store: { type: 'string' },
  },
};

const ShoppingListUpdateSchema_params = {
  type: 'object',
  required: ['shoppingListID'],
  properties: {
    shoppingListID: { type: 'string' },
  },
};

const ShoppingListDeleteSchema_params = {
  type: 'object',
  required: ['shoppingListID'],
  properties: {
    shoppingListID: { type: 'string' },
  },
};


module.exports = {
  getShoppingListSchema_params,
  getShoppingListsSchema_query,
  ShoppingListUpdateSchema_body,
  ShoppingListUpdateSchema_params,
  ShoppingListDeleteSchema_params,
};