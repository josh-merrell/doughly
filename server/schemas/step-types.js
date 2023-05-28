//STEPS
const getStepsSchema_query = {
  type: 'object',
  properties: {
    stepIDs: { type: 'array', items: { type: 'integer' } },
    title: { type: 'string' },
  },
};

const getStepSchema_params = {
  type: 'object',
  required: ['stepID'],
  properties: {
    stepID: { type: 'string' },
  },
};

const newStepSchema_body = {
  type: 'object',
  required: ['title', 'description'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
};

const StepUpdateSchema_body = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
};

const StepUpdateSchema_params = {
  type: 'object',
  required: ['stepID'],
  properties: {
    stepID: { type: 'string' },
  },
};

const StepDeleteSchema_params = {
  type: 'object',
  required: ['stepID'],
  properties: {
    stepID: { type: 'string' },
  },
};

//RECIPE STEPS
const getRecipeStepsSchema_query = {
  type: 'object',
  properties: {
    recipeStepIDs: { type: 'array', items: { type: 'integer' } },
    recipeID: { type: 'string' },
    stepID: { type: 'string' },
  },
};

const getRecipeStepSchema_params = {
  type: 'object',
  required: ['recipeStepID'],
  properties: {
    recipeStepID: { type: 'string' },
  },
};

const newRecipeStepSchema_body = {
  type: 'object',
  required: ['recipeID', 'sequence', 'stepID'],
  properties: {
    recipeID: { type: 'integer' },
    sequence: { type: 'integer' },
    stepID: { type: 'integer' },
  },
};

const RecipeStepUpdateSchema_body = {
  type: 'object',
  properties: {
    sequence: { type: 'integer' },
  },
};

const RecipeStepUpdateSchema_params = {
  type: 'object',
  required: ['recipeStepID'],
  properties: {
    recipeStepID: { type: 'string' },
  },
};

const RecipeStepDeleteSchema_params = {
  type: 'object',
  required: ['recipeStepID'],
  properties: {
    recipeStepID: { type: 'string' },
  },
};

module.exports = {
  getStepsSchema_query,
  getStepSchema_params,
  newStepSchema_body,
  StepUpdateSchema_body,
  StepUpdateSchema_params,
  StepDeleteSchema_params,
  getRecipeStepsSchema_query,
  getRecipeStepSchema_params,
  newRecipeStepSchema_body,
  RecipeStepUpdateSchema_body,
  RecipeStepUpdateSchema_params,
  RecipeStepDeleteSchema_params,
};
