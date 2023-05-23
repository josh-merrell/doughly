const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { queryItemsSplitter } = require('../../../middleware/queryStringSplitting');
const handler = require('./handler');
const { getInvoiceNotesSchema, newInvoiceNoteSchema } = require('../../../schemas/invoice-types');

const router = express.Router();
const h = handler;

router.get('/', queryItemsSplitter('invoiceNoteIDs'), routeValidator(getInvoiceNotesSchema, 'query'), errorCatcher(h.getInvoiceNotes));
router.post(
  '/:invoiceID',
  (req, res, next) => {
    next();
  },
  routeValidator(newInvoiceNoteSchema, 'body', 'invoiceID'),
  errorCatcher(h.createInvoiceNote),
);

module.exports = router;
