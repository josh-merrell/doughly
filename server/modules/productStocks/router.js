const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/authenticateJWT');
const handler = require('./handler');
const {
  getProductStocksSchema_query,
  getProductStockSchema_params,
  newProductStockSchema_body,
  ProductStockUpdateSchema_body,
  ProductStockUpdateSchema_params,
  ProductStockDeleteSchema_params,
} = require('../../schemas/productStock-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:productStockID', routeValidator(getProductStockSchema_params, 'params'), errorCatcher(h.getProductStockByID));
router.delete('/:productStockID', routeValidator(ProductStockDeleteSchema_params, 'params'), errorCatcher(h.deleteProductStock));
router.patch(
  '/:productStockID',
  routeValidator(ProductStockUpdateSchema_params, 'params'),
  routeValidator(ProductStockUpdateSchema_body, 'body'),
  errorCatcher(h.updateProductStock),
);
router.get('/', routeValidator(getProductStocksSchema_query, 'query'), errorCatcher(h.getProductStocks));
router.post('/', routeValidator(newProductStockSchema_body, 'body'), errorCatcher(h.createProductStock));

module.exports = router;
