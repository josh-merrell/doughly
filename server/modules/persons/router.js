const express = require('express');

const { routeValidator } = require('../../middleware/validating');
const { errorCatcher } = require('../../middleware/errorHandling');
const { queryItemsSplitter } = require('../../middleware/queryStringSplitting');
const handler = require('./handler');
const { getPersonsSchema, newPersonSchema, personUpdateSchema } = require('../../schemas/person-types');

const router = express.Router();
const h = handler;

router.get('/:personID', errorCatcher(h.getPersonByID));
router.get('/', queryItemsSplitter('personIDs'), routeValidator(getPersonsSchema, 'query'), errorCatcher(h.getPersons));
router.post('/', routeValidator(newPersonSchema, 'body'), errorCatcher(h.createPerson));

router.patch('/:personID', routeValidator(personUpdateSchema, 'body', 'personID'), errorCatcher(h.updatePerson));
router.delete('/:personID', errorCatcher(h.deletePerson));

module.exports = router;
