const express = require('express');
// const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const router = express.Router();
const h = handler;

// process revenue cat webhooks without authentication
router.post('/revenueCatWebhook', errorCatcher(h.revenueCatWebhook));

router.use(authenticateJWT);

router.post('/newPurchase', authenticateJWT, errorCatcher(h.processNewPurchase));
router.post('/newPurchaseRevenueCatSubPackage', authenticateJWT, errorCatcher(h.newPurchaseRevenueCatSubPackage));
router.post('/newPurchaseRevenueCatProdPackage', authenticateJWT, errorCatcher(h.newPurchaseRevenueCatProdPackage));
router.post('/updatePermissions', authenticateJWT, errorCatcher(h.updatePermissions));
router.post('/updateEntitlementsRevenueCat', authenticateJWT, errorCatcher(h.updateEntitlementsRevenueCat));

module.exports = router;
