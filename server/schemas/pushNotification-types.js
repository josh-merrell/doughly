const newPushTokenSchema_body = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string' },
  },
};

const removePushTokenSchema_params = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string' },
  },
};

module.exports = {
  newPushTokenSchema_body,
  removePushTokenSchema_params,
};
