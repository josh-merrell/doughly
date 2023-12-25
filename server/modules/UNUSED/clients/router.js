const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
const { getClientsSchema_query, getClientSchema_params, newClientSchema_body, clientUpdateSchema_body, clientUpdateSchema_params, clientDeleteSchema_params } = require('../../../schemas/client-types');

const router = express.Router();
const h = handler;

router.get('/:clientID', authenticateJWT, routeValidator(getClientSchema_params, 'params'), errorCatcher(h.getClientByID));
router.get('/', authenticateJWT, routeValidator(getClientsSchema_query, 'query'), errorCatcher(h.getClients));
router.post('/', authenticateJWT, generateID, routeValidator(newClientSchema_body, 'body'), errorCatcher(h.createClient));

router.patch('/:clientID', authenticateJWT, routeValidator(clientUpdateSchema_body, 'body'), routeValidator(clientUpdateSchema_params, 'params'), errorCatcher(h.updateClient));
router.delete('/:clientID', authenticateJWT, routeValidator(clientDeleteSchema_params, 'params'), errorCatcher(h.deleteClient));

module.exports = router;
