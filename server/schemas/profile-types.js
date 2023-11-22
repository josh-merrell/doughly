const getFriendSchema_params = {
  type: 'object',
  required: ['friendUserID'],
  properties: {
    friendUserID: { type: 'string' },
  },
};

const getFollowerSchema_params = {
  type: 'object',
  required: ['followerUserID'],
  properties: {
    followerUserID: { type: 'string' },
  },
};

module.exports = {
  getFriendSchema_params,
  getFollowerSchema_params,
};
