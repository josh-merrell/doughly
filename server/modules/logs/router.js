const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const k = require('./kitchen/handler');
const r = require('./recipe/handler');
const u = require('./user/handler');
const { getLogSchema_params, getLogsSchema_query, newLogSchema_body } = require('../../schemas/log-types');

const router = express.Router();

router.use(authenticateJWT);

router.get('/kitchen/:logID', routeValidator(getLogSchema_params, 'params'), errorCatcher(k.getLogByID));
router.get('/kitchen/', routeValidator(getLogsSchema_query, 'query'), errorCatcher(k.getLogs));
router.post('/kitchen/', generateID, routeValidator(newLogSchema_body, 'body'), errorCatcher(k.createLog));

router.get('/recipe/:logID', routeValidator(getLogSchema_params, 'params'), errorCatcher(r.getLogByID));
router.get('/recipe/', routeValidator(getLogsSchema_query, 'query'), errorCatcher(r.getLogs));
router.post('/recipe/', generateID, routeValidator(newLogSchema_body, 'body'), errorCatcher(r.createLog));

router.get('/user/:logID', routeValidator(getLogSchema_params, 'params'), errorCatcher(u.getLogByID));
router.get('/user/', routeValidator(getLogsSchema_query, 'query'), errorCatcher(u.getLogs));
router.post('/user/', generateID, routeValidator(newLogSchema_body, 'body'), errorCatcher(u.createLog));

module.exports = router;
