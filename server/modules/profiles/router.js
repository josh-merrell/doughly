const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { getFriendSchema_params, getFollowerSchema_params, getFriendSchema_query } = require('../../schemas/profile-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/friends/:friendUserID', routeValidator(getFriendSchema_params, 'params'), errorCatcher(h.getFriend));
router.get('/friends', routeValidator(getFriendSchema_query, 'query'), errorCatcher(h.getFriends));
router.get('/followers/:followerUserID', routeValidator(getFollowerSchema_params, 'params'), errorCatcher(h.getFollower));
router.get('/followers', errorCatcher(h.getFollowers));
router.get('/', errorCatcher(h.getProfile));

module.exports = router;
