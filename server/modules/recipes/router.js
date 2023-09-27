const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const handler = require('./handler');
const { getRecipesSchema_query, getRecipeSchema_params, newRecipeSchema_body, RecipeUpdateSchema_body, RecipeUpdateSchema_params, RecipeDeleteSchema_params } = require('../../schemas/recipe-types');
const recipeCategoriesRouter = require('./categories/router');
const recipeComponentsRouter = require('./components/router');

const router = express.Router();
const h = handler;

router.use('/categories', recipeCategoriesRouter);
router.use('/components', recipeComponentsRouter);

router.use(authenticateJWT);

router.get('/:recipeID', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeByID));
router.patch('/:recipeID', routeValidator(RecipeUpdateSchema_body, 'body'), routeValidator(RecipeUpdateSchema_params, 'params'), errorCatcher(h.updateRecipe));
router.delete('/:recipeID', routeValidator(RecipeDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipe));
router.get('/', routeValidator(getRecipesSchema_query, 'query'), errorCatcher(h.getRecipes));
router.post('/', generateID, routeValidator(newRecipeSchema_body, 'body'), errorCatcher(h.createRecipe));

module.exports = router;
