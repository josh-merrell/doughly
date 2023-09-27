const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getOrderTagsSchema_query, getOrderTagSchema_params, newOrderTagSchema_body, OrderTagDeleteSchema_params } = require('../../../schemas/tag-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:orderTagID', routeValidator(getOrderTagSchema_params, 'params'), errorCatcher(h.getOrderTagByID));
router.delete('/:orderTagID', routeValidator(OrderTagDeleteSchema_params, 'params'), errorCatcher(h.deleteOrderTag));
router.get('/', routeValidator(getOrderTagsSchema_query, 'query'), errorCatcher(h.getOrderTags));
router.post('/', generateID, routeValidator(newOrderTagSchema_body, 'body'), errorCatcher(h.createOrderTag));

module.exports = router;
