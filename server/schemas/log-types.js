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
    category: { type: 'string' },
    eventType: { type: 'string' },
    createdAfter: { type: 'string' },
    createdBefore: { type: 'string' },
  },
};

const newLogSchema_body = {
  type: 'object',
  required: ['subjectID', 'category', 'eventType'],
  properties: {
    subjectID: { type: 'integer' },
    category: { type: 'string' },
    eventType: { type: 'string' },
    resultValue: { type: 'string' },
  },
};

module.exports = {
  getLogSchema_params,
  getLogsSchema_query,
  newLogSchema_body,
};
