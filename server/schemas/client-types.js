const clientUpdateSchema = {
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

const newClientSchema = {
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

const getClientsSchema = {
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

module.exports = {
  newClientSchema,
  clientUpdateSchema,
  getClientsSchema,
};
