const express = require('express');

const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const { userAgentRedirect } = require('../../middleware/linkPreview');

const router = express.Router();
const h = handler;

// redirect request to app if not from allowed user agents
router.use(userAgentRedirect);

router.get('/recipe/:recipeID', errorCatcher(h.getRecipePreview));
router.get('/invite', errorCatcher(h.getInvitePreview));

module.exports = router;

/**
 example share link: https://api.doughly.co/linkPreviews/recipe/1124033100000001
**/
