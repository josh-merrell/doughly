const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const handler = require('./handler');
const {
  getRecipesSchema_query,
  subscribeRecipe_body,
  getRecipeSchema_params,
  newRecipeSchema_body,
  RecipeUpdateSchema_body,
  RecipeUpdateSchema_params,
  RecipeDeleteSchema_params,
  useRecipeSchema_params,
  useRecipeSchema_body,
  constructRecipeSchema_body,
  SubscriptionDeleteSchema_params,
  newRecipeVisionSchema_body,
} = require('../../schemas/recipe-types');
const recipeCategoriesRouter = require('./categories/router');
const recipeComponentsRouter = require('./components/router');

const router = express.Router();
const h = handler;

router.use('/categories', recipeCategoriesRouter);
router.use('/components', recipeComponentsRouter);

router.use(authenticateJWT);

router.post('/vision', routeValidator(newRecipeVisionSchema_body, 'body'), errorCatcher(h.createRecipeVision));
router.post('/constructed', routeValidator(constructRecipeSchema_body, 'body'), errorCatcher(h.constructRecipe));
router.post('/use/:recipeID', routeValidator(useRecipeSchema_params, 'params'), routeValidator(useRecipeSchema_body, 'body'), errorCatcher(h.useRecipe));
router.post('/subscribe', generateID, routeValidator(subscribeRecipe_body, 'body'), errorCatcher(h.subscribeRecipe));
router.post('/', generateID, routeValidator(newRecipeSchema_body, 'body'), errorCatcher(h.createRecipe));

router.get('/discover', errorCatcher(h.getDiscoverRecipes));
router.get('/subscriptions', errorCatcher(h.getRecipeSubscriptions));
router.get('/:recipeID/subscriptions', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.subscriptionsByRecipeID));
router.get('/:recipeID/ingredients', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeIngredients));
router.get('/:recipeID/tools', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeTools));
router.get('/:recipeID/steps', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeSteps));
router.get('/:recipeID', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeByID));
router.patch('/:recipeID', routeValidator(RecipeUpdateSchema_body, 'body'), routeValidator(RecipeUpdateSchema_params, 'params'), errorCatcher(h.updateRecipe));
router.delete('/subscriptions/:subscriptionID', routeValidator(SubscriptionDeleteSchema_params, 'params'), errorCatcher(h.unsubscribeRecipe));
router.delete('/:recipeID', routeValidator(RecipeDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipe));
router.get('/', routeValidator(getRecipesSchema_query, 'query'), errorCatcher(h.getRecipes));

module.exports = router;
