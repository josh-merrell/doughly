const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getOrdersSchema_query, getOrderSchema_params, newOrderSchema_body, OrderUpdateSchema_body, OrderUpdateSchema_params, OrderDeleteSchema_params } = require('../../../schemas/order-types');
const orderItemsRouter = require('./items/router');

const router = express.Router();
const h = handler;

router.use('/items', orderItemsRouter);

router.use(authenticateJWT);

router.get('/:orderID', routeValidator(getOrderSchema_params, 'params'), errorCatcher(h.getOrderByID));
router.get('/', routeValidator(getOrdersSchema_query, 'query'), errorCatcher(h.getOrders));
router.post('/', generateID, routeValidator(newOrderSchema_body, 'body'), errorCatcher(h.createOrder));

router.patch('/:orderID', routeValidator(OrderUpdateSchema_body, 'body'), routeValidator(OrderUpdateSchema_params, 'params'), errorCatcher(h.updateOrder));
router.delete('/:orderID', routeValidator(OrderDeleteSchema_params, 'params'), errorCatcher(h.deleteOrder));

module.exports = router;
