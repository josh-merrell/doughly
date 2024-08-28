const express = require('express');

const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const router = express.Router();
const h = handler;

router.get('/app-store', errorCatcher(h.getAppStorePreview));
router.get('/play-store', errorCatcher(h.getPlayStorePreview));

module.exports = router;
