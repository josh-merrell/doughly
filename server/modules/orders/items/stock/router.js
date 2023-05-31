const express = require('express');

const { routeValidator } = require('../../../../middleware/validating');
const { errorCatcher } = require('../../../../middleware/errorHandling');
const handler = require('./handler');
const {
  getStockItemsSchema_query,
  getStockItemSchema_params,
  newStockItemsSchema_body,
  StockItemsUpdateSchema_body,
  StockItemsUpdateSchema_params,
  StockItemsDeleteSchema_params,
} = require('../../../../schemas/stockItem-types');

const router = express.Router();
const h = handler;

router.get('/:stockItemID', routeValidator(getStockItemSchema_params, 'params'), errorCatcher(h.getStockItemByID));
router.patch('/:stockItemID', routeValidator(StockItemsUpdateSchema_body, 'body'), routeValidator(StockItemsUpdateSchema_params, 'params'), errorCatcher(h.updateStockItem));
router.delete('/:stockItemID', routeValidator(StockItemsDeleteSchema_params, 'params'), errorCatcher(h.deleteStockItem));
router.get('/', routeValidator(getStockItemsSchema_query, 'query'), errorCatcher(h.getStockItems));
router.post('/', routeValidator(newStockItemsSchema_body, 'body'), errorCatcher(h.createStockItem));

module.exports = router;
