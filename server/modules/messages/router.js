const express = require('express');
// const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/', errorCatcher(h.getMessages));
router.post('/acknowledge', errorCatcher(h.acknowledgeMessage));
router.post('/delete', errorCatcher(h.deleteMessage));

module.exports = router;
