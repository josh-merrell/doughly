const express = require('express');
const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
import { getFriendshipsSchema_query, getFriendshipSchema_params, newFriendshipSchema_body, friendshipUpdateSchema_body, friendshipUpdateSchema_params, friendshipDeleteSchema_params } from '../../../schemas/friendship-types';

const router = express.Router();
const h = handler;
router.use(authenticateJWT);

router.get('/:friendshipID', routeValidator(getFriendshipSchema_params, 'params'), errorCatcher(h.getFriendshipByID));
router.get('/', routeValidator(getFriendshipsSchema_query, 'query'), errorCatcher(h.getFriendships));
router.post('/', generateID, routeValidator(newFriendshipSchema_body, 'body'), errorCatcher(h.createFriendship));
router.patch('/:friendshipID', routeValidator(friendshipUpdateSchema_body, 'body'), routeValidator(friendshipUpdateSchema_params, 'params'), errorCatcher(h.updateFriend));
router.delete('/:friendshipID', routeValidator(friendshipDeleteSchema_params, 'params'), errorCatcher(h.deleteFriendship));

module.exports = router;
