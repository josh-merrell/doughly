const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const handler = require('./handler');
const { getRecipesSchema_query, getRecipeSchema_params, newRecipeSchema_body, RecipeUpdateSchema_body, RecipeUpdateSchema_params, RecipeDeleteSchema_params, useRecipeSchema_params, useRecipeSchema_body, constructRecipeSchema_body } = require('../../schemas/recipe-types');
const recipeCategoriesRouter = require('./categories/router');
const recipeComponentsRouter = require('./components/router');

const router = express.Router();
const h = handler;

router.use('/categories', recipeCategoriesRouter);
router.use('/components', recipeComponentsRouter);

// router.use((req, res, next) => {
//   console.log(`request made to: ${Object.keys(req)}`);
//   console.log(`PATH: ${req.path}, METHOD: ${req.method}, HEADERS: ${JSON.stringify(req.headers)}`);
//   req.userID = 'ade96f70-4ec5-4ab9-adfe-0645b16e1ced';
//   next();
// });

router.use(authenticateJWT);

router.post('/constructed', routeValidator(constructRecipeSchema_body, 'body'), errorCatcher(h.constructRecipe));
router.post('/', generateID, routeValidator(newRecipeSchema_body, 'body'), errorCatcher(h.createRecipe));

router.get('/:recipeID', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeByID));
router.get('/:recipeID/ingredients', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeIngredients));
router.get('/:recipeID/tools', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeTools));
router.get('/:recipeID/steps', routeValidator(getRecipeSchema_params, 'params'), errorCatcher(h.getRecipeSteps));
router.patch('/:recipeID', routeValidator(RecipeUpdateSchema_body, 'body'), routeValidator(RecipeUpdateSchema_params, 'params'), errorCatcher(h.updateRecipe));
router.delete('/:recipeID', routeValidator(RecipeDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipe));
router.get('/', routeValidator(getRecipesSchema_query, 'query'), errorCatcher(h.getRecipes));
router.post('/use/:recipeID', routeValidator(useRecipeSchema_params, 'params'), routeValidator(useRecipeSchema_body, 'body'), errorCatcher(h.useRecipe));

module.exports = router;
