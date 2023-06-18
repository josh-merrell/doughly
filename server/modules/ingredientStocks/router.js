const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { getIngredientStocksSchema_query, getIngredientStockSchema_params, newIngredientStockSchema_body, IngredientStockUpdateSchema_body, IngredientStockUpdateSchema_params, IngredientStockDeleteSchema_params } = require('../../schemas/ingredient-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:ingredientStockID', routeValidator(getIngredientStockSchema_params, 'params'), errorCatcher(h.getIngredientStockByID));
router.get('/', routeValidator(getIngredientStocksSchema_query, 'query'), errorCatcher(h.getIngredientStocks));
router.post('/', routeValidator(newIngredientStockSchema_body, 'body'), errorCatcher(h.createIngredientStock));

router.patch('/:ingredientStockID', routeValidator(IngredientStockUpdateSchema_body, 'body'), routeValidator(IngredientStockUpdateSchema_params, 'params'), errorCatcher(h.updateIngredientStock));
router.delete('/:ingredientStockID', routeValidator(IngredientStockDeleteSchema_params, 'params'), errorCatcher(h.deleteIngredientStock));

module.exports = router;
