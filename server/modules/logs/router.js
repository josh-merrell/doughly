const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const handler = require('./handler');
const { getLogSchema_params, getLogsSchema_query, newLogSchema_body } = require('../../schemas/log-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);
router.get('/:logID', routeValidator(getLogSchema_params, 'params'), errorCatcher(h.getLogByID));
router.get('/', routeValidator(getLogsSchema_query, 'query'), errorCatcher(h.getLogs));
router.post('/', generateID, routeValidator(newLogSchema_body, 'body'), errorCatcher(h.createLog));

module.exports = router;
