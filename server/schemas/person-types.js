const personUpdateSchema_body = {
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

const personUpdateSchema_params = {
  type: 'object',
  required: ['personID'],
  properties: {
    personID: { type: 'string' },
  },
};

const personDeleteSchema_params = {
  type: 'object',
  required: ['personID'],
  properties: {
    personID: { type: 'string' },
  },
};

const newPersonSchema_body = {
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

const getPersonsSchema_query = {
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

const getPersonSchema_params = {
  type: 'object',
  required: ['personID'],
  properties: {
    personID: { type: 'string' },
  },
};

module.exports = {
  getPersonsSchema_query,
  getPersonSchema_params,
  newPersonSchema_body,
  personUpdateSchema_body,
  personUpdateSchema_params,
  personDeleteSchema_params,
};
