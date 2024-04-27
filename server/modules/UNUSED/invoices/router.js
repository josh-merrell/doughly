const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { newInvoiceSchema_body, invoiceUpdateSchema_body, invoiceUpdateSchema_params, getInvoicesSchema_query, getInvoiceSchema_params } = require('../../../schemas/invoice-types');
const invoiceNotesRouter = require('./notes/router');
const invoiceLogsRouter = require('./logs/router');

const router = express.Router();
const h = handler;

router.use('/notes', invoiceNotesRouter);
router.use('/logs', invoiceLogsRouter);

router.use(authenticateJWT);
router.get('/', routeValidator(getInvoicesSchema_query, 'query'), routeValidator(getInvoiceSchema_params, 'params'), errorCatcher(h.getInvoices));
router.post('/', generateID, routeValidator(newInvoiceSchema_body, 'body'), errorCatcher(h.createInvoice));
router.patch('/:invoiceID', routeValidator(invoiceUpdateSchema_body, 'body'), routeValidator(invoiceUpdateSchema_params, 'params'), errorCatcher(h.updateInvoice));

module.exports = router;
