const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { generateID } = require('../../middleware/ID');
const k = require('./kitchen/handler');
const r = require('./recipe/handler');
const u = require('./user/handler');
const rf = require('./recipeFeedback/handler');
const { getLogSchema_params, getLogsSchema_query, newLogSchema_body, getRecipeFeedbackSchema_params, getRecipeFeedbacksSchema_query, newRecipeFeedbackSchema_body } = require('../../schemas/log-types');

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

router.get('/recipeFeedback/:logID', routeValidator(getRecipeFeedbackSchema_params, 'params'), errorCatcher(rf.getLogByID));
router.get('/recipeFeedback/', routeValidator(getRecipeFeedbacksSchema_query, 'query'), errorCatcher(rf.getLogs));
router.post('/recipeFeedback/', generateID, routeValidator(newRecipeFeedbackSchema_body, 'body'), errorCatcher(rf.createLog));

module.exports = router;
