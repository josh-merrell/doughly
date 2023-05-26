const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const handler = require('./handler');
const {
  getOrdersTasksSchema_query,
  getOrderTaskSchema_params,
  newOrderTaskSchema_body,
  OrderTaskUpdateSchema_body,
  OrderTaskUpdateSchema_params,
  OrderTaskDeleteSchema_params,
} = require('../../../schemas/orderTask-types');

const router = express.Router();
const h = handler;

router.get('/:orderTaskID', routeValidator(getOrderTaskSchema_params, 'params'), errorCatcher(h.getOrderTaskByID));
router.patch('/:orderTaskID', routeValidator(OrderTaskUpdateSchema_body, 'body'), routeValidator(OrderTaskUpdateSchema_params, 'params'), errorCatcher(h.updateOrderTask));
router.delete('/:orderTaskID', routeValidator(OrderTaskDeleteSchema_params, 'params'), errorCatcher(h.deleteOrderTask));
router.get('/', routeValidator(getOrdersTasksSchema_query, 'query'), errorCatcher(h.getOrderTasks));
router.post('/', routeValidator(newOrderTaskSchema_body, 'body'), errorCatcher(h.createOrderTask));

module.exports = router;
