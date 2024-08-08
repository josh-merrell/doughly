const express = require('express');
// const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.post('/newPurchase', authenticateJWT, errorCatcher(h.processNewPurchase));
router.post('/updatePermissions', authenticateJWT, errorCatcher(h.updatePermissions));
router.post('/updateEntitlementsRevenueCat', authenticateJWT, errorCatcher(h.updateEntitlementsRevenueCat));

module.exports = router;
