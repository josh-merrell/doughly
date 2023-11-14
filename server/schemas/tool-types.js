//TOOLS
const getToolsSchema_query = {
  type: 'object',
  properties: {
    toolIDs: { type: 'array', items: { type: 'integer' } },
    name: { type: 'string' },
    brand: { type: 'string' },
  },
};

const getToolSchema_params = {
  type: 'object',
  required: ['toolID'],
  properties: {
    toolID: { type: 'integer' },
  },
};

const newToolSchema_body = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    brand: { type: 'string' },
  },
};

const ToolUpdateSchema_body = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    brand: { type: 'string' },
  },
};

const ToolUpdateSchema_params = {
  type: 'object',
  required: ['toolID'],
  properties: {
    toolID: { type: 'string' },
  },
};

const ToolDeleteSchema_params = {
  type: 'object',
  required: ['toolID'],
  properties: {
    toolID: { type: 'string' },
  },
};

//RECIPE TOOLS

const getRecipeToolsSchema_query = {
  type: 'object',
  properties: {
    recipeToolIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
    toolID: { type: 'string' },
  },
};

const getRecipeToolSchema_params = {
  type: 'object',
  required: ['recipeToolID'],
  properties: {
    recipeToolID: { type: 'string' },
  },
};

const newRecipeToolSchema_body = {
  type: 'object',
  required: ['recipeID', 'toolID', 'quantity'],
  properties: {
    recipeID: { type: 'integer' },
    toolID: { type: 'integer' },
    quantity: { type: 'integer' },
  },
};

const RecipeToolUpdateSchema_body = {
  type: 'object',
  properties: {
    recipeID: { type: 'integer' },
    toolID: { type: 'integer' },
    quantity: { type: 'integer' },
  },
};

const RecipeToolUpdateSchema_params = {
  type: 'object',
  required: ['recipeToolID'],
  properties: {
    recipeToolID: { type: 'string' },
    quantity: { type: 'string' },
  },
};

const RecipeToolDeleteSchema_params = {
  type: 'object',
  required: ['recipeToolID'],
  properties: {
    recipeToolID: { type: 'string' },
  },
};

//TOOL STOCKS

const getToolStocksSchema_query = {
  type: 'object',
  properties: {
    toolStockIDs: { type: 'array', items: { type: 'integer' } },
    toolID: { type: 'string' },
    purchasedBy: { type: 'string' },
  },
};

const getToolStockSchema_params = {
  type: 'object',
  required: ['toolStockID'],
  properties: {
    toolStockID: { type: 'string' },
  },
};

const newToolStockSchema_body = {
  type: 'object',
  required: ['toolID', 'quantity'],
  properties: {
    toolID: { type: 'integer' },
    quantity: { type: 'number' },
  },
};

const ToolStockUpdateSchema_body = {
  type: 'object',
  properties: {
    quantity: { type: 'string' },
  },
};

const ToolStockUpdateSchema_params = {
  type: 'object',
  required: ['toolStockID'],
  properties: {
    toolStockID: { type: 'string' },
  },
};

const ToolStockDeleteSchema_params = {
  type: 'object',
  required: ['toolStockID'],
  properties: {
    toolStockID: { type: 'string' },
  },
};

module.exports = {
  getToolsSchema_query,
  getToolSchema_params,
  newToolSchema_body,
  ToolUpdateSchema_body,
  ToolUpdateSchema_params,
  ToolDeleteSchema_params,
  getRecipeToolsSchema_query,
  getRecipeToolSchema_params,
  newRecipeToolSchema_body,
  RecipeToolUpdateSchema_body,
  RecipeToolUpdateSchema_params,
  RecipeToolDeleteSchema_params,
  getToolStocksSchema_query,
  getToolStockSchema_params,
  newToolStockSchema_body,
  ToolStockUpdateSchema_body,
  ToolStockUpdateSchema_params,
  ToolStockDeleteSchema_params,
};
