const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const handler = require('./handler');
const {
  getEmployeesSchema_query,
  getEmployeeSchema_params,
  newEmployeeSchema_body,
  employeeUpdateSchema_body,
  employeeUpdateSchema_params,
  employeeDeleteSchema_params,
} = require('../../schemas/employee-types');

const router = express.Router();
const h = handler;

router.get('/:employeeID', routeValidator(getEmployeeSchema_params, 'params'), errorCatcher(h.getEmployeeByID));
router.get('/', routeValidator(getEmployeesSchema_query, 'query'), errorCatcher(h.getEmployees));
router.post('/', routeValidator(newEmployeeSchema_body, 'body'), errorCatcher(h.createEmployee));

router.patch('/:employeeID', routeValidator(employeeUpdateSchema_body, 'body'), routeValidator(employeeUpdateSchema_params, 'params'), errorCatcher(h.updateEmployee));
router.delete('/:employeeID', routeValidator(employeeDeleteSchema_params, 'params'), errorCatcher(h.deleteEmployee));

module.exports = router;
