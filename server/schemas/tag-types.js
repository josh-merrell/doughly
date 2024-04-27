const getTagsSchema_query = {
  type: 'object',
  properties: {
    tagIDs: { type: 'array', items: { type: 'integer' } },
    name: { type: 'string' },
  },
};

const getTagSchema_params = {
  type: 'object',
  required: ['tagID'],
  properties: {
    tagID: { type: 'string' },
  },
};

const newTagSchema_body = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

const TagUpdateSchema_body = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
};

const TagUpdateSchema_params = {
  type: 'object',
  required: ['tagID'],
  properties: {
    tagID: { type: 'string' },
  },
};

const TagDeleteSchema_params = {
  type: 'object',
  required: ['tagID'],
  properties: {
    tagID: { type: 'string' },
  },
};

const getOrderTagsSchema_query = {
  type: 'object',
  properties: {
    orderTagIDs: { type: 'array', items: { type: 'integer' } },
    orderID: { type: 'string' },
    tagID: { type: 'string' },
  },
};

const getOrderTagSchema_params = {
  type: 'object',
  required: ['orderTagID'],
  properties: {
    orderTagID: { type: 'string' },
  },
};

const newOrderTagSchema_body = {
  type: 'object',
  required: ['orderID', 'tagID'],
  properties: {
    orderID: { type: 'integer' },
    tagID: { type: 'integer' },
  },
};

const OrderTagDeleteSchema_params = {
  type: 'object',
  required: ['orderTagID'],
  properties: {
    orderTagID: { type: 'string' },
  },
};

const getRecipeTagsSchema_query = {
  type: 'object',
  properties: {
    recipeTagIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
    tagID: { type: 'string' },
  },
};

const getRecipeTagSchema_params = {
  type: 'object',
  required: ['recipeTagID'],
  properties: {
    recipeTagID: { type: 'string' },
  },
};

const newRecipeTagSchema_body = {
  type: 'object',
  required: ['recipeID', 'tagID'],
  properties: {
    recipeID: { type: 'integer' },
    tagID: { type: 'integer' },
  },
};

const RecipeTagDeleteSchema_params = {
  type: 'object',
  required: ['recipeTagID'],
  properties: {
    recipeTagID: { type: 'string' },
  },
};

module.exports = {
  getTagsSchema_query,
  getTagSchema_params,
  newTagSchema_body,
  TagUpdateSchema_body,
  TagUpdateSchema_params,
  TagDeleteSchema_params,
  getOrderTagsSchema_query,
  getOrderTagSchema_params,
  newOrderTagSchema_body,
  OrderTagDeleteSchema_params,
  getRecipeTagsSchema_query,
  getRecipeTagSchema_params,
  newRecipeTagSchema_body,
  RecipeTagDeleteSchema_params,
};
