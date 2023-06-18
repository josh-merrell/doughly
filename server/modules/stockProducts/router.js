const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { getStockProductsSchema_query, getStockProductSchema_params, newStockProductSchema_body, StockProductUpdateSchema_body, StockProductUpdateSchema_params, StockProductDeleteSchema_params } = require('../../schemas/stockProduct-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:stockProductID', routeValidator(getStockProductSchema_params, 'params'), errorCatcher(h.getStockProductByID));
router.delete('/:stockProductID', routeValidator(StockProductDeleteSchema_params, 'params'), errorCatcher(h.deleteStockProduct));
router.patch('/:stockProductID', routeValidator(StockProductUpdateSchema_params, 'params'), routeValidator(StockProductUpdateSchema_body, 'body'), errorCatcher(h.updateStockProduct));
router.get('/', routeValidator(getStockProductsSchema_query, 'query'), errorCatcher(h.getStockProducts));
router.post('/', routeValidator(newStockProductSchema_body, 'body'), errorCatcher(h.createStockProduct));

module.exports = router;
