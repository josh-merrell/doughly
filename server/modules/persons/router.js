const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { authenticateJWT } = require('../../middleware/auth');
const handler = require('./handler');
const { getPersonsSchema_query, getPersonSchema_params, newPersonSchema_body, personUpdateSchema_body, personUpdateSchema_params, personDeleteSchema_params } = require('../../schemas/person-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

router.get('/:personID', routeValidator(getPersonSchema_params, 'query'), errorCatcher(h.getPersonByID));
router.get('/', routeValidator(getPersonsSchema_query, 'query'), errorCatcher(h.getPersons));
router.post('/', routeValidator(newPersonSchema_body, 'body'), errorCatcher(h.createPerson));

router.patch('/:personID', routeValidator(personUpdateSchema_body, 'body'), routeValidator(personUpdateSchema_params, 'params'), errorCatcher(h.updatePerson));
router.delete('/:personID', routeValidator(personDeleteSchema_params, 'query'), errorCatcher(h.deletePerson));

module.exports = router;
