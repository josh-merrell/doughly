const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const handler = require('./handler');
const { getInvoiceNotesSchema_query, newInvoiceNoteSchema_body, newInvoiceNoteSchema_params } = require('../../../schemas/invoice-types');

const router = express.Router();
const h = handler;

router.get('/', routeValidator(getInvoiceNotesSchema_query, 'query'), errorCatcher(h.getInvoiceNotes));
router.post('/:invoiceID', routeValidator(newInvoiceNoteSchema_body, 'body'), routeValidator(newInvoiceNoteSchema_params, 'params'), errorCatcher(h.createInvoiceNote));

module.exports = router;
