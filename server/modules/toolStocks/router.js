const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const {
  getToolStocksSchema_query,
  getToolStockSchema_params,
  newToolStockSchema_body,
  ToolStockUpdateSchema_body,
  ToolStockUpdateSchema_params,
  ToolStockDeleteSchema_params,
} = require('../../schemas/tool-types');

const router = express.Router();
const h = handler;

router.get('/:toolStockID', routeValidator(getToolStockSchema_params, 'params'), errorCatcher(h.getToolStockByID));
router.patch('/:toolStockID', routeValidator(ToolStockUpdateSchema_body, 'body'), routeValidator(ToolStockUpdateSchema_params, 'params'), errorCatcher(h.updateToolStock));
router.delete('/:toolStockID', routeValidator(ToolStockDeleteSchema_params, 'params'), errorCatcher(h.deleteToolStock));
router.get('/', routeValidator(getToolStocksSchema_query, 'query'), errorCatcher(h.getToolStocks));
router.post('/', routeValidator(newToolStockSchema_body, 'body'), errorCatcher(h.createToolStock));

module.exports = router;
