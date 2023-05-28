const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const {
  getStepsSchema_query,
  getStepSchema_params,
  newStepSchema_body,
  StepUpdateSchema_body,
  StepUpdateSchema_params,
  StepDeleteSchema_params,
} = require('../../schemas/step-types');
const recipeStepsRouter = require('./recipe/router');

const router = express.Router();
const h = handler;

router.use('/recipe', recipeStepsRouter);

router.get('/:stepID', routeValidator(getStepSchema_params, 'params'), errorCatcher(h.getStepByID));
router.get('/', routeValidator(getStepsSchema_query, 'query'), errorCatcher(h.getSteps));
router.post('/', routeValidator(newStepSchema_body, 'body'), errorCatcher(h.createStep));

router.patch('/:stepID', routeValidator(StepUpdateSchema_body, 'body'), routeValidator(StepUpdateSchema_params, 'params'), errorCatcher(h.updateStep));
router.delete('/:stepID', routeValidator(StepDeleteSchema_params, 'params'), errorCatcher(h.deleteStep));

module.exports = router;
