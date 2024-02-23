const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getRecipeComponentsSchema_query, getRecipeComponentSchema_params, newRecipeComponentSchema_body, RecipeComponentUpdateSchema_body, RecipeComponentUpdateSchema_params, RecipeComponentDeleteSchema_params } = require('../../../schemas/recipe-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:recipeComponentID', routeValidator(getRecipeComponentSchema_params, 'params'), errorCatcher(h.getRecipeComponentByID));
router.patch('/:recipeComponentID', routeValidator(RecipeComponentUpdateSchema_body, 'body'), routeValidator(RecipeComponentUpdateSchema_params, 'params'), errorCatcher(h.updateRecipeComponent));
router.delete('/:recipeComponentID', routeValidator(RecipeComponentDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipeComponent));
router.get('/', routeValidator(getRecipeComponentsSchema_query, 'query'), errorCatcher(h.getRecipeComponents));
router.post('/', generateID, routeValidator(newRecipeComponentSchema_body, 'body'), errorCatcher(h.createRecipeComponent));

module.exports = router;
