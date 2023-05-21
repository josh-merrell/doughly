const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { queryItemsSplitter } = require('../../middleware/queryStringSplitting');
const handler = require('./handler');
const { newInvoiceSchema, invoiceUpdateSchema, getInvoicesSchema } = require('../../schemas/invoice-types');

const router = express.Router();
const h = handler;

router.get('/', queryItemsSplitter('invoiceIDs'), routeValidator(getInvoicesSchema, 'query'), errorCatcher(h.getInvoices));

router.post('/', routeValidator(newInvoiceSchema, 'body'), errorCatcher(h.createInvoice));

router.patch('/:invoiceID', routeValidator(invoiceUpdateSchema, 'body', 'invoiceID'), errorCatcher(h.updateInvoice));

module.exports = router;
