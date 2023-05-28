const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const {
  getToolsSchema_query,
  getToolSchema_params,
  newToolSchema_body,
  ToolUpdateSchema_body,
  ToolUpdateSchema_params,
  ToolDeleteSchema_params,
} = require('../../schemas/tool-types');
const recipeToolsRouter = require('./recipe/router');

const router = express.Router();
const h = handler;

router.use('/recipe', recipeToolsRouter);

router.get('/:toolID', routeValidator(getToolSchema_params, 'params'), errorCatcher(h.getToolByID));
router.patch('/:toolID', routeValidator(ToolUpdateSchema_body, 'body'), routeValidator(ToolUpdateSchema_params, 'params'), errorCatcher(h.updateTool));
router.delete('/:toolID', routeValidator(ToolDeleteSchema_params, 'params'), errorCatcher(h.deleteTool));
router.get('/', routeValidator(getToolsSchema_query, 'query'), errorCatcher(h.getTools));
router.post('/', routeValidator(newToolSchema_body, 'body'), errorCatcher(h.createTool));

module.exports = router;
