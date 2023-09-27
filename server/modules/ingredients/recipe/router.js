const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getRecipeIngredientsSchema_query, getRecipeIngredientSchema_params, newRecipeIngredientSchema_body, RecipeIngredientUpdateSchema_body, RecipeIngredientUpdateSchema_params, RecipeIngredientDeleteSchema_params } = require('../../../schemas/ingredient-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);
router.get('/:recipeIngredientID', routeValidator(getRecipeIngredientSchema_params, 'params'), errorCatcher(h.getRecipeIngredientByID));
router.get('/', routeValidator(getRecipeIngredientsSchema_query, 'query'), errorCatcher(h.getRecipeIngredients));
router.post('/', generateID, routeValidator(newRecipeIngredientSchema_body, 'body'), errorCatcher(h.createRecipeIngredient));

router.patch('/:recipeIngredientID', routeValidator(RecipeIngredientUpdateSchema_body, 'body'), routeValidator(RecipeIngredientUpdateSchema_params, 'params'), errorCatcher(h.updateRecipeIngredient));
router.delete('/:recipeIngredientID', routeValidator(RecipeIngredientDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipeIngredient));

module.exports = router;
