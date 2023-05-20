const newPersonSchema = {
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

const getPersonsSchema = {
  type: 'object',
  properties: {
    personIDs: { type: 'array', items: { type: 'integer' } },
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
  newPersonSchema,
  getPersonsSchema,
};
