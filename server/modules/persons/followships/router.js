const express = require('express');
const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getFollowshipSchema_params, getFollowshipsSchema_query, newFollowshipSchema_body, followshipDeleteSchema_params } = require('../../../schemas/followship-types');

const router = express.Router();
const h = handler;
router.use(authenticateJWT);

router.get('/:followers', errorCatcher(h.getFollowers));
router.get('/:followshipID', routeValidator(getFollowshipSchema_params, 'params'), errorCatcher(h.getFollowshipByID));
router.get('/', routeValidator(getFollowshipsSchema_query, 'query'), errorCatcher(h.getFollowships));
router.post('/', generateID, routeValidator(newFollowshipSchema_body, 'body'), errorCatcher(h.createFollowship));
router.delete('/:followshipID', routeValidator(followshipDeleteSchema_params, 'params'), errorCatcher(h.deleteFollowship));

module.exports = router;
