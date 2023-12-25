const express = require('express');

const { routeValidator } = require('../../../../middleware/validating');
const { errorCatcher } = require('../../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../../middleware/auth');
const { generateID } = require('../../../../middleware/ID');
const handler = require('./handler');
const { getRecipeTagsSchema_query, getRecipeTagSchema_params, newRecipeTagSchema_body, RecipeTagDeleteSchema_params } = require('../../../../schemas/tag-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:recipeTagID', routeValidator(getRecipeTagSchema_params, 'params'), errorCatcher(h.getRecipeTagByID));
router.delete('/:recipeTagID', routeValidator(RecipeTagDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipeTag));
router.get('/', routeValidator(getRecipeTagsSchema_query, 'query'), errorCatcher(h.getRecipeTags));
router.post('/', generateID, routeValidator(newRecipeTagSchema_body, 'body'), errorCatcher(h.createRecipeTag));

module.exports = router;
