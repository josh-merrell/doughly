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
  required: ['title', 'servings', 'lifespanDays', 'timePrep', 'type'],
  properties: {
    title: { type: 'string' },
    servings: { type: 'integer' },
    lifespanDays: { type: 'integer' },
    recipeCategoryID: { type: 'integer' },
    type: { type: 'string' },
    timePrep: { type: 'integer' },
    timeBake: { type: 'integer' },
    photoURL: { type: 'string' },
  },
};

const newRecipeVisionSchema_body = {
  type: 'object',
  required: ['recipeSourceImageURL'],
  properties: {
    recipeImageURL: { type: 'string' },
    recipePhotoURL: { type: 'string' },
  },
};

const newRecipeFromUrlSchema_body = {
  type: 'object',
  required: ['recipeURL'],
  properties: {
    recipeURL: { type: 'string' },
  },
};

const RecipeUpdateSchema_body = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    servings: { type: 'integer' },
    lifespanDays: { type: 'integer' },
    recipeCategoryID: { type: 'integer' },
    type: { type: 'string' },
    status: { type: 'string' },
    timePrep: { type: 'integer' },
    timeBake: { type: ['integer', 'null'], nullable: true },
    photoURL: { type: 'string' },
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

const SubscriptionDeleteSchema_params = {
  type: 'object',
  required: ['subscriptionID'],
  properties: {
    subscriptionID: { type: 'string' },
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

const constructRecipeSchema_body = {
  type: 'object',
  required: ['sourceRecipeID', 'title', 'servings', 'lifespanDays', 'timePrep', 'type', 'ingredients', 'tools', 'steps'],
  properties: {
    sourceRecipeID: { type: 'integer' },
    title: { type: 'string' },
    recipeCategoryID: { type: 'integer' },
    servings: { type: 'integer' },
    lifespanDays: { type: 'integer' },
    type: { type: 'string' },
    timePrep: { type: 'integer' },
    timeBake: { type: 'integer' },
    photoURL: { type: 'string' },
    components: { type: 'array', items: { type: 'object' } },
    ingredients: { type: 'array', items: { type: 'object' } },
    tools: { type: 'array', items: { type: 'object' } },
    steps: { type: 'array', items: { type: 'object' } },
  },
};

// Use Recipe
const useRecipeSchema_params = {
  type: 'object',
  required: ['recipeID'],
  properties: {
    recipeID: { type: 'string' },
  },
};

const useRecipeSchema_body = {
  type: 'object',
  required: ['satisfaction', 'difficulty'],
  properties: {
    satisfaction: { type: 'integer' },
    difficulty: { type: 'integer' },
    note: { type: 'string' },
  },
};

const subscribeRecipe_body = {
  type: 'object',
  required: ['sourceRecipeID', 'newRecipeID'],
  properties: {
    sourceRecipeID: { type: 'integer' },
    newRecipeID: { type: 'integer' },
  },
};

const syncRecipe_body = {
  type: 'object',
  required: ['sourceRecipeID', 'newRecipeID'],
  properties: {
    sourceRecipeID: { type: 'integer' },
    childRecipeID: { type: 'integer' },
    newIngredientMappings: { type: 'array', items: { type: 'object' } },
    newToolMappings: { type: 'array', items: { type: 'object' } },
  },
};

module.exports = {
  getRecipesSchema_query,
  getRecipeSchema_params,
  newRecipeSchema_body,
  newRecipeVisionSchema_body,
  newRecipeFromUrlSchema_body,
  RecipeUpdateSchema_body,
  RecipeUpdateSchema_params,
  RecipeDeleteSchema_params,
  SubscriptionDeleteSchema_params,
  getRecipeComponentsSchema_query,
  getRecipeComponentSchema_params,
  newRecipeComponentSchema_body,
  RecipeComponentUpdateSchema_body,
  RecipeComponentUpdateSchema_params,
  RecipeComponentDeleteSchema_params,
  constructRecipeSchema_body,
  useRecipeSchema_params,
  useRecipeSchema_body,
  subscribeRecipe_body,
  syncRecipe_body,
};
