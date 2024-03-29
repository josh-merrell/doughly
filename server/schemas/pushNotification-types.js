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

const getUserPushTokensSchema_params = {
  type: 'object',
  required: ['userID'],
  properties: {
    userID: { type: 'string' },
  },
};

module.exports = {
  newPushTokenSchema_body,
  removePushTokenSchema_params,
  getUserPushTokensSchema_params,
};
