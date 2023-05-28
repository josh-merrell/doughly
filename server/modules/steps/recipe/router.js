const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const handler = require('./handler');
const {
  getRecipeStepsSchema_query,
  getRecipeStepSchema_params,
  newRecipeStepSchema_body,
  RecipeStepUpdateSchema_body,
  RecipeStepUpdateSchema_params,
  RecipeStepDeleteSchema_params,
} = require('../../../schemas/step-types');

const router = express.Router();
const h = handler;

router.get('/:recipeStepID', routeValidator(getRecipeStepSchema_params, 'params'), errorCatcher(h.getStepByID));
router.get('/', routeValidator(getRecipeStepsSchema_query, 'query'), errorCatcher(h.getSteps));
router.post('/', routeValidator(newRecipeStepSchema_body, 'body'), errorCatcher(h.createStep));

router.patch('/:recipeStepID', routeValidator(RecipeStepUpdateSchema_body, 'body'), routeValidator(RecipeStepUpdateSchema_params, 'params'), errorCatcher(h.updateStep));
router.delete('/:recipeStepID', routeValidator(RecipeStepDeleteSchema_params, 'params'), errorCatcher(h.deleteStep));

module.exports = router;
