const express = require('express');

const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const handler = require('./handler');

const router = express.Router();
const h = handler;

router.post('/batchUpdate', errorCatcher(h.batchUpdateRatios));
router.post('/', errorCatcher(h.addUnitRatio));

router.get('/unitRatio', authenticateJWT, errorCatcher(h.getUnitRatio));
router.get('/allDraft', errorCatcher(h.getAllDraftRatios));
router.get('/', errorCatcher(h.checkForRatio));

module.exports = router;