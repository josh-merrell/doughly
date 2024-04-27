const unitEnum = process.env.MEASUREMENT_UNITS.split(',');
// INGREDIENTS
const getIngredientsSchema_query = {
  type: 'object',
  properties: {
    ingredientIDs: { type: 'array', items: { type: 'integer' } },
    name: { type: 'string' },
  },
};

const getIngredientSchema_params = {
  type: 'object',
  required: ['ingredientID'],
  properties: {
    ingredientID: { type: 'string' },
  },
};

const newIngredientSchema_body = {
  type: 'object',
  required: ['name', 'lifespanDays', 'purchaseUnit', 'gramRatio'],
  properties: {
    name: { type: 'string' },
    lifespanDays: { type: 'integer' },
    purchaseUnit: {
      type: 'string',
      enum: unitEnum,
    },
    gramRatio: { type: 'number' },
    brand: { type: 'string' },
    needsReview: { type: 'boolean' },
  },
};

const IngredientUpdateSchema_body = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    lifespanDays: { type: 'integer' },
    purchaseUnit: {
      type: 'string',
      enum: unitEnum,
    },
    gramRatio: { type: 'number' },
    brand: { type: 'string' },
  },
};

const IngredientUpdateSchema_params = {
  type: 'object',
  required: ['ingredientID'],
  properties: {
    ingredientID: { type: 'string' },
  },
};

const IngredientDeleteSchema_params = {
  type: 'object',
  required: ['ingredientID'],
  properties: {
    ingredientID: { type: 'string' },
  },
};

// RECIPE INGREDIENTS
const getRecipeIngredientsSchema_query = {
  type: 'object',
  properties: {
    recipeIngredientIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
    ingredientID: { type: 'string' },
  },
};

const getRecipeIngredientSchema_params = {
  type: 'object',
  required: ['recipeIngredientID'],
  properties: {
    recipeIngredientID: { type: 'string' },
  },
};

const newRecipeIngredientSchema_body = {
  type: 'object',
  required: ['recipeID', 'ingredientID', 'measurement', 'measurementUnit'],
  properties: {
    recipeID: { type: 'integer' },
    ingredientID: { type: 'integer' },
    measurementUnit: { type: 'string', enum: unitEnum },
    measurement: { type: 'number' },
    purchaseUnitRatio: { type: 'number' },
    preparation: { type: 'string' },
    component: { type: 'string' },
    needsReview: { type: 'boolean' },
  },
};

const RecipeIngredientUpdateSchema_body = {
  type: 'object',
  properties: {
    measurementUnit: { type: 'string' },
    measurement: { type: 'number' },
    purchaseUnitRatio: { type: 'number' },
  },
};

const RecipeIngredientUpdateSchema_params = {
  type: 'object',
  required: ['recipeIngredientID'],
  properties: {
    recipeIngredientID: { type: 'string' },
    measurementUnit: { type: 'string', enum: unitEnum },
    measurement: { type: 'number' },
    purchaseUnitRatio: { type: 'number' },
    preparation: { type: 'string' },
    component: { type: 'string' },
  },
};

const RecipeIngredientDeleteSchema_params = {
  type: 'object',
  required: ['recipeIngredientID'],
  properties: {
    recipeIngredientID: { type: 'string' },
  },
};

const getPurEstSchema_query = {
  type: 'object',
  required: ['ingredientName', 'measurementUnit', 'purchaseUnit'],
  properties: {
    ingredientName: { type: 'string' },
    measurementUnit: { type: 'string', enum: unitEnum },
    purchaseUnit: { type: 'string', enum: unitEnum },
  },
};

// INGREDIENT STOCKS
const getIngredientStocksSchema_query = {
  type: 'object',
  properties: {
    ingredientStockIDs: { type: 'array', items: { type: 'integer' } },
    ingredientID: { type: 'string' },
  },
};

const getIngredientStockSchema_params = {
  type: 'object',
  required: ['ingredientStockID'],
  properties: {
    ingredientStockID: { type: 'string' },
  },
};

const newIngredientStockSchema_body = {
  type: 'object',
  required: ['ingredientID', 'measurement', 'purchasedDate'],
  properties: {
    ingredientID: { type: 'integer' },
    measurement: { type: 'number' },
    purchasedDate: { type: 'string' },
  },
};

const IngredientStockUpdateSchema_body = {
  type: 'object',
  properties: {
    grams: { type: 'number' },
    purchasedDate: { type: 'string' },
  },
};

const IngredientStockUpdateSchema_params = {
  type: 'object',
  required: ['ingredientStockID'],
  properties: {
    ingredientStockID: { type: 'string' },
  },
};

const IngredientStockDeleteSchema_params = {
  type: 'object',
  required: ['ingredientStockID'],
  properties: {
    ingredientStockID: { type: 'string' },
  },
};

module.exports = {
  getIngredientsSchema_query,
  getIngredientSchema_params,
  newIngredientSchema_body,
  IngredientUpdateSchema_body,
  IngredientUpdateSchema_params,
  IngredientDeleteSchema_params,
  getRecipeIngredientsSchema_query,
  getRecipeIngredientSchema_params,
  newRecipeIngredientSchema_body,
  RecipeIngredientUpdateSchema_body,
  RecipeIngredientUpdateSchema_params,
  RecipeIngredientDeleteSchema_params,
  getPurEstSchema_query,
  getIngredientStocksSchema_query,
  getIngredientStockSchema_params,
  newIngredientStockSchema_body,
  IngredientStockUpdateSchema_body,
  IngredientStockUpdateSchema_params,
  IngredientStockDeleteSchema_params,
};
