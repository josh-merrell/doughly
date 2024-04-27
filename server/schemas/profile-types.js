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

const getFriendSchema_query = {
  type: 'object',
  properties: {
    friendStatus: { type: 'string' },
  },
};

const getProfileSchema_query = {
  type: 'object',
  properties: {
    userID: { type: 'string' },
  },
};

const getProfileSearchSchema_query = {
  type: 'object',
  properties: {
    searchQuery: { type: 'string' },
  },
};

module.exports = {
  getFriendSchema_params,
  getFollowerSchema_params,
  getFriendSchema_query,
  getProfileSearchSchema_query,
  getProfileSchema_query,
};
