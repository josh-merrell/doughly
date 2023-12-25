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

const getRecipeFeedbackSchema_params = {
  type: 'object',
  required: ['logID'],
  properties: {
    logID: { type: 'integer' },
  },
};

const getRecipeFeedbacksSchema_query = {
  type: 'object',
  properties: {
    logIDs: { type: 'array', items: { type: 'string' } },
    onlyMe: { type: 'string' },
    recipeID: { type: 'string' },
    satisfaction: { type: 'string' },
    difficulty: { type: 'string' },
    createdAfter: { type: 'string' },
    createdBefore: { type: 'string' },
  },
};

const newRecipeFeedbackSchema_body = {
  type: 'object',
  required: ['recipeID', 'satisfaction', 'difficulty'],
  properties: {
    recipeID: { type: 'integer' },
    satisfaction: { type: 'string' },
    difficulty: { type: 'string' },
    note: { type: 'string' },
  },
};

module.exports = {
  getLogSchema_params,
  getLogsSchema_query,
  newLogSchema_body,
  getRecipeFeedbackSchema_params,
  getRecipeFeedbacksSchema_query,
  newRecipeFeedbackSchema_body,
};
