const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getShoppingListIngredientSchema_params, getIngredientsByShoppingListSchema_params, ShoppingListIngredientUpdateSchema_params, ShoppingListIngredientUpdateSchema_body, ShoppingListIngredientDeleteSchema_params, createShoppingListIngredientSchema_body } = require('../../../schemas/shopping-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);
router.get('/:shoppingListIngredientID', routeValidator(getShoppingListIngredientSchema_params, 'params'), errorCatcher(h.getShoppingListIngredientByID));
router.get('/byList/:shoppingListID', routeValidator(getIngredientsByShoppingListSchema_params, 'params'), errorCatcher(h.getIngredientsByShoppingList));
router.post('/:shoppingListID', generateID, routeValidator(getIngredientsByShoppingListSchema_params, 'params'), routeValidator(createShoppingListIngredientSchema_body, 'body'), errorCatcher(h.createShoppingListIngredient));
router.patch('/:shoppingListIngredientID', routeValidator(ShoppingListIngredientUpdateSchema_params, 'params'), routeValidator(ShoppingListIngredientUpdateSchema_body, 'body'), errorCatcher(h.updateShoppingListIngredient));
router.delete('/:shoppingListIngredientID', routeValidator(ShoppingListIngredientDeleteSchema_params, 'params'), errorCatcher(h.deleteShoppingListIngredient));

module.exports = router;