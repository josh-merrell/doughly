const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { newPaymentSchema_body, getPaymentsSchema_query } = require('../../../schemas/payment-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/', routeValidator(getPaymentsSchema_query, 'query'), errorCatcher(h.getPayments));
router.post('/', generateID, routeValidator(newPaymentSchema_body, 'body'), errorCatcher(h.createPayment));

module.exports = router;
