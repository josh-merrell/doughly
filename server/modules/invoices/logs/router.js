const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const handler = require('./handler');
const { getInvoiceLogsSchema_query, newInvoiceLogSchema_body, newInvoiceLogSchema_params } = require('../../../schemas/invoice-types');

const router = express.Router();
const h = handler;

router.get('/', routeValidator(getInvoiceLogsSchema_query, 'query'), errorCatcher(h.getInvoiceLogs));
router.post('/:invoiceID', routeValidator(newInvoiceLogSchema_body, 'body'), routeValidator(newInvoiceLogSchema_params, 'params'), errorCatcher(h.createInvoiceLog));

module.exports = router;
