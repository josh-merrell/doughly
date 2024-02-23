const getClientsSchema_query = {
  type: 'object',
  properties: {
    clientIDs: { type: 'array', items: { type: 'integer' } },
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

const getClientSchema_params = {
  type: 'object',
  required: ['clientID'],
  properties: {
    clientID: { type: 'string' },
  },
};

const newClientSchema_body = {
  type: 'object',
  required: ['nameFirst', 'nameLast', 'email', 'city', 'state', 'address1'],
  properties: {
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

const clientUpdateSchema_body = {
  type: 'object',
  properties: {
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

const clientUpdateSchema_params = {
  type: 'object',
  required: ['clientID'],
  properties: {
    clientID: { type: 'string' },
  },
};

const clientDeleteSchema_params = {
  type: 'object',
  required: ['clientID'],
  properties: {
    clientID: { type: 'string' },
  },
};

module.exports = {
  getClientsSchema_query,
  getClientSchema_params,
  newClientSchema_body,
  clientUpdateSchema_body,
  clientUpdateSchema_params,
  clientDeleteSchema_params,
};
