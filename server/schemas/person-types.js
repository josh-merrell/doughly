const personUpdateSchema = {
  type: 'object',
  properties: {
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

const newPersonSchema = {
  type: 'object',
  required: ['nameFirst', 'nameLast', 'email', 'city', 'state', 'address1', 'zip'],
  properties: {
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

const getPersonsSchema = {
  type: 'object',
  properties: {
    personIDs: { type: 'array', items: { type: 'number' } },
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    phone: { type: 'string' },
    zip: { type: 'string' },
  },
};

module.exports = {
  newPersonSchema,
  getPersonsSchema,
  personUpdateSchema,
};
