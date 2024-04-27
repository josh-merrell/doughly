const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getTagsSchema_query, getTagSchema_params, newTagSchema_body, TagUpdateSchema_body, TagUpdateSchema_params, TagDeleteSchema_params } = require('../../../schemas/tag-types');
const recipeTagsRouter = require('./recipe/router');
const orderTagsRouter = require('./order/router');

const router = express.Router();
const h = handler;

router.use('/recipe', recipeTagsRouter);
router.use('/order', orderTagsRouter);

router.use(authenticateJWT);

router.get('/:tagID', routeValidator(getTagSchema_params, 'params'), errorCatcher(h.getTagByID));
router.patch('/:tagID', routeValidator(TagUpdateSchema_body, 'body'), routeValidator(TagUpdateSchema_params, 'params'), errorCatcher(h.updateTag));
router.delete('/:tagID', routeValidator(TagDeleteSchema_params, 'params'), errorCatcher(h.deleteTag));
router.get('/', routeValidator(getTagsSchema_query, 'query'), errorCatcher(h.getTags));
router.post('/', generateID, routeValidator(newTagSchema_body, 'body'), errorCatcher(h.createTag));

module.exports = router;
