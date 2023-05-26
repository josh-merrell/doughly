const getRecipesSchema_query = {
  type: 'object',
  properties: {
    cursor: { type: 'string' },
    limit: { type: 'integer' },
    recipeIDs: { type: 'array', items: { type: 'integer' } },
    title: { type: 'string' },
    recipeCategoryID: { type: 'string' },
  },
};

const getRecipeSchema_params = {
  type: 'object',
  required: ['recipeID'],
  properties: {
    recipeID: { type: 'string' },
  },
};

const newRecipeSchema_body = {
  type: 'object',
  required: ['title', 'servings', 'lifespanDays'],
  properties: {
    title: { type: 'string' },
    servings: { type: 'integer' },
    lifespanDays: { type: 'integer' },
    recipeCategoryID: { type: 'integer' },
  },
};

const RecipeUpdateSchema_body = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    servings: { type: 'integer' },
    lifespanDays: { type: 'integer' },
    recipeCategoryID: { type: 'integer' },
  },
};

const RecipeUpdateSchema_params = {
  type: 'object',
  required: ['recipeID'],
  properties: {
    recipeID: { type: 'string' },
  },
};

const RecipeDeleteSchema_params = {
  type: 'object',
  required: ['recipeID'],
  properties: {
    recipeID: { type: 'string' },
  },
};

const getRecipeCategorySchema_params = {
  type: 'object',
  required: ['recipeCategoryID'],
  properties: {
    recipeCategoryID: { type: 'string' },
  },
};

const newRecipeCategorySchema_body = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

const RecipeCategoryUpdateSchema_body = {
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
};

const RecipeCategoryUpdateSchema_params = {
  type: 'object',
  required: ['recipeCategoryID'],
  properties: {
    recipeCategoryID: { type: 'string' },
  },
};

const RecipeCategoryDeleteSchema_params = {
  type: 'object',
  required: ['recipeCategoryID'],
  properties: {
    recipeCategoryID: { type: 'string' },
  },
};

const getRecipeComponentsSchema_query = {
  type: 'object',
  properties: {
    recipeComponentIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
  },
};

const getRecipeComponentSchema_params = {
  type: 'object',
  required: ['recipeComponentID'],
  properties: {
    recipeComponentID: { type: 'string' },
  },
};

const newRecipeComponentSchema_body = {
  type: 'object',
  required: ['recipeID', 'componentID', 'componentAdvanceDays'],
  properties: {
    recipeID: { type: 'integer' },
    componentID: { type: 'integer' },
    componentAdvanceDays: { type: 'integer' },
  },
};

const RecipeComponentUpdateSchema_body = {
  type: 'object',
  properties: {
    componentAdvanceDays: { type: 'integer' },
  },
};

const RecipeComponentUpdateSchema_params = {
  type: 'object',
  required: ['recipeComponentID'],
  properties: {
    recipeComponentID: { type: 'string' },
  },
};

const RecipeComponentDeleteSchema_params = {
  type: 'object',
  required: ['recipeComponentID'],
  properties: {
    recipeComponentID: { type: 'string' },
  },
};

module.exports = {
  getRecipesSchema_query,
  getRecipeSchema_params,
  newRecipeSchema_body,
  RecipeUpdateSchema_body,
  RecipeUpdateSchema_params,
  RecipeDeleteSchema_params,
  getRecipeCategorySchema_params,
  newRecipeCategorySchema_body,
  RecipeCategoryUpdateSchema_body,
  RecipeCategoryUpdateSchema_params,
  RecipeCategoryDeleteSchema_params,
  getRecipeComponentsSchema_query,
  getRecipeComponentSchema_params,
  newRecipeComponentSchema_body,
  RecipeComponentUpdateSchema_body,
  RecipeComponentUpdateSchema_params,
  RecipeComponentDeleteSchema_params,
};
