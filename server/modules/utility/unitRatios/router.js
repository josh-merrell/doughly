const express = require('express');

const { errorCatcher } = require('../../../middleware/errorHandling');
const handler = require('./handler');

const router = express.Router();
const h = handler;

router.post('/batchUpdate', errorCatcher(h.batchUpdateRatios));
router.post('/', errorCatcher(h.addUnitRatio));

router.get('/allDraft', errorCatcher(h.getAllDraftRatios));
router.get('/', errorCatcher(h.checkForRatio));

module.exports = router;