const express = require('express');

const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const router = express.Router();
const h = handler;

router.get('/appStore', errorCatcher(h.getAppStorePreview));
router.get('/playStore', errorCatcher(h.getPlayStorePreview));

module.exports = router;
