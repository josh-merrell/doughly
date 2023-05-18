const express = require('express');

const { routeValidator } = require('../../middlewares/validating');
const { errorCatcher } = require('../../middlewares/errorHandling');
const { queryItemsSplitter } = require('../../middlewares/queryStringSplitting');
const handler = require('./handler');
const { getClientsSchema, newClientSchema, clientUpdateSchema } = require('../../schemas/client-types');

const router = express.Router();
const h = handler;

router.get('/', queryItemsSplitter('clientIDs'), routeValidator(getClientsSchema, 'query'), errorCatcher(h.getClients));
router.post('/', routeValidator(newClientSchema, 'body'), errorCatcher(h.createClient));

router.patch('/:clientID', routeValidator(clientUpdateSchema, 'body'), errorCatcher(h.updateClient));
router.delete('/:clientID', errorCatcher(h.deleteClient));
