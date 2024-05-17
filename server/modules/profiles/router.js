const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { getFriendSchema_params, getFollowerSchema_params, getFriendSchema_query, getProfileSearchSchema_query, getProfileSchema_query } = require('../../schemas/profile-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.delete('/:userID', errorCatcher(h.deleteProfile));
router.post('/backups/all', errorCatcher(h.dailyBackupAllUsers));
router.post('/backups/:userID', errorCatcher(h.createDailyBackup));
router.post('/:userID', errorCatcher(h.populateAccount));
router.get('/friends/:friendUserID', routeValidator(getFriendSchema_params, 'params'), errorCatcher(h.getFriend));
router.get('/friends', routeValidator(getFriendSchema_query, 'query'), errorCatcher(h.getFriends));
router.get('/followers/:followerUserID', routeValidator(getFollowerSchema_params, 'params'), errorCatcher(h.getFollower));
router.get('/followers', errorCatcher(h.getFollowers));
router.get('/following', errorCatcher(h.getFollowing));
router.get('/search', routeValidator(getProfileSearchSchema_query, 'query'), errorCatcher(h.searchProfiles));
router.get('/', routeValidator(getProfileSchema_query, 'query'), errorCatcher(h.getProfile));

module.exports = router;
