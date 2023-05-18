const clientUpdateSchema = {
  type: 'object',
  required: ['clientID'],
  properties: {
    clientID: { type: 'integer' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
  },
};

const newClientSchema = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'city', 'state', 'address1'],
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
  },
};

const getClientsSchema = {
  type: 'object',
  properties: {
    clientIDs: { type: 'array', items: { type: 'integer' } },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    address2: { type: 'string' },
    phone: { type: 'string' },
  },
};

module.exports = {
  newClientSchema,
  clientUpdateSchema,
  getClientsSchema,
};
