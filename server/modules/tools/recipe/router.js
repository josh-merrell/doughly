const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getRecipeToolsSchema_query, getRecipeToolSchema_params, newRecipeToolSchema_body, RecipeToolUpdateSchema_body, RecipeToolUpdateSchema_params, RecipeToolDeleteSchema_params } = require('../../../schemas/tool-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:recipeToolID', routeValidator(getRecipeToolSchema_params, 'params'), errorCatcher(h.getRecipeToolByID));
router.patch('/:recipeToolID', routeValidator(RecipeToolUpdateSchema_body, 'body'), routeValidator(RecipeToolUpdateSchema_params, 'params'), errorCatcher(h.updateRecipeTool));
router.delete('/:recipeToolID', routeValidator(RecipeToolDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipeTool));
router.get('/', routeValidator(getRecipeToolsSchema_query, 'query'), errorCatcher(h.getRecipeTools));
router.post('/', generateID, routeValidator(newRecipeToolSchema_body, 'body'), errorCatcher(h.createRecipeTool));

module.exports = router;
