const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { queryItemsSplitter } = require('../../middleware/queryStringSplitting');
const handler = require('./handler');
const { newPaymentSchema, getPaymentsSchema } = require('../../schemas/payment-types');

const router = express.Router();
const h = handler;

router.get('/', queryItemsSplitter('paymentIDs'), routeValidator(getPaymentsSchema, 'query'), errorCatcher(h.getPayments));

router.post('/', routeValidator(newPaymentSchema, 'body'), errorCatcher(h.createPayment));

module.exports = router;
