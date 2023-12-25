const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getShoppingListRecipeSchema_params, getRecipesByShoppingListSchema_params, ShoppingListRecipeDeleteSchema_params, createShoppingListRecipeSchema_body } = require('../../../schemas/shopping-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);
router.get('/:shoppingListRecipeID', routeValidator(getShoppingListRecipeSchema_params, 'params'), errorCatcher(h.getShoppingListRecipeByID));
router.get('/byList/:shoppingListID', routeValidator(getRecipesByShoppingListSchema_params, 'params'), errorCatcher(h.getRecipesByShoppingList));
router.post('/:shoppingListID', generateID, routeValidator(getRecipesByShoppingListSchema_params, 'params'), routeValidator(createShoppingListRecipeSchema_body, 'body'), errorCatcher(h.createShoppingListRecipe));
router.delete('/:shoppingListRecipeID', routeValidator(ShoppingListRecipeDeleteSchema_params, 'params'), errorCatcher(h.deleteShoppingListRecipe));

module.exports = router;
