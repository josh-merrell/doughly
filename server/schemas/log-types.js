const getLogSchema_params = {
  type: 'object',
  required: ['logID'],
  properties: {
    logID: { type: 'integer' },
  },
};

const getLogsSchema_query = {
  type: 'object',
  properties: {
    logIDs: { type: 'array', items: { type: 'integer' } },
    subjectID: { type: 'integer' },
    eventType: { type: 'string' },
    createdAfter: { type: 'string' },
    createdBefore: { type: 'string' },
  },
};

const newLogSchema_body = {
  type: 'object',
  required: ['subjectID', 'eventType'],
  properties: {
    subjectID: { type: 'integer' },
    associatedID: { type: 'integer' },
    eventType: { type: 'string' },
    oldValue: { type: 'string' },
    newValue: { type: 'string' },
    message: { type: 'string' },
  },
};

module.exports = {
  getLogSchema_params,
  getLogsSchema_query,
  newLogSchema_body,
};
