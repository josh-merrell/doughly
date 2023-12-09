const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getShoppingListSchema_params, getShoppingListsSchema_query, ShoppingListDeleteSchema_params, ShoppingListUpdateSchema_body, ShoppingListUpdateSchema_params } = require('../../../schemas/shopping-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);
router.get('/:shoppingListID', routeValidator(getShoppingListSchema_params, 'params'), errorCatcher(h.getShoppingListByID));
router.get('/', routeValidator(getShoppingListsSchema_query, 'query'), errorCatcher(h.getShoppingLists));
router.post('/', generateID, errorCatcher(h.createShoppingList));

router.patch('/:shoppingListID', routeValidator(ShoppingListUpdateSchema_body, 'body'), routeValidator(ShoppingListUpdateSchema_params, 'params'), errorCatcher(h.updateShoppingList));
router.delete('/:shoppingListID', routeValidator(ShoppingListDeleteSchema_params, 'params'), errorCatcher(h.deleteShoppingList));

module.exports = router;
