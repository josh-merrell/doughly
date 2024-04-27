const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { newPushTokenSchema_body, removePushTokenSchema_params, getUserPushTokensSchema_params } = require('../../schemas/pushNotification-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:userID', routeValidator(getUserPushTokensSchema_params, 'params'), errorCatcher(h.getOtherUserPushTokens));
router.get('/', errorCatcher(h.getUserPushTokens));
router.post('/notification', errorCatcher(h.sendNotification));
router.post('/', routeValidator(newPushTokenSchema_body, 'body'), errorCatcher(h.addPushToken));
router.delete('/:token', routeValidator(removePushTokenSchema_params, 'params'), errorCatcher(h.removePushToken));
router.delete('/', errorCatcher(h.removeUserPushTokens));

module.exports = router;
