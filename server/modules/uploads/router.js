const express = require('express');
const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const { newPhotoURLSchema_body } = require('../../schemas/upload-types');
const handler = require('./handler');
const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.post('/presigned', routeValidator(newPhotoURLSchema_body, 'body'), errorCatcher(h.createPresignedURL));

module.exports = router;
