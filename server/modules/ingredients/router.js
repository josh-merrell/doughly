const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const handler = require('./handler');
const { getIngredientsSchema_query, getIngredientSchema_params, newIngredientSchema_body, IngredientUpdateSchema_body, IngredientUpdateSchema_params, IngredientDeleteSchema_params } = require('../../schemas/ingredient-types');
const recipeIngredientsRouter = require('./recipe/router');

const router = express.Router();
const h = handler;

router.use('/recipe', recipeIngredientsRouter);

router.use(authenticateJWT);
router.get('/:ingredientID', routeValidator(getIngredientSchema_params, 'params'), errorCatcher(h.getIngredientByID));
router.get('/', routeValidator(getIngredientsSchema_query, 'query'), errorCatcher(h.getIngredients));
router.post('/', generateID, routeValidator(newIngredientSchema_body, 'body'), generateID, errorCatcher(h.createIngredient));

router.patch('/:ingredientID', routeValidator(IngredientUpdateSchema_body, 'body'), routeValidator(IngredientUpdateSchema_params, 'params'), errorCatcher(h.updateIngredient));
router.delete('/:ingredientID', routeValidator(IngredientDeleteSchema_params, 'params'), errorCatcher(h.deleteIngredient));

module.exports = router;
