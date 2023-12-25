const express = require('express');

const { routeValidator } = require('../../../../../middleware/validating');
const { errorCatcher } = require('../../../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../../../middleware/auth');
const { generateID } = require('../../../../../middleware/ID');
const handler = require('./handler');
const { getTaskItemsSchema_query, getTaskItemSchema_params, newTaskItemSchema_body, TaskItemUpdateSchema_body, TaskItemUpdateSchema_params, TaskItemDeleteSchema_params } = require('../../../../../schemas/taskItem-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:taskItemID', routeValidator(getTaskItemSchema_params, 'params'), errorCatcher(h.getTaskItemByID));
router.patch('/:taskItemID', routeValidator(TaskItemUpdateSchema_body, 'body'), routeValidator(TaskItemUpdateSchema_params, 'params'), errorCatcher(h.updateTaskItem));
router.delete('/:taskItemID', routeValidator(TaskItemDeleteSchema_params, 'params'), errorCatcher(h.deleteTaskItem));
router.get('/', routeValidator(getTaskItemsSchema_query, 'query'), errorCatcher(h.getTaskItems));
router.post('/', generateID, routeValidator(newTaskItemSchema_body, 'body'), errorCatcher(h.createTaskItem));

module.exports = router;
