const getFollowshipsSchema_query = {
  type: 'object',
  properties: {
    followshipIDs: { type: 'array', items: { type: 'number' } },
    name: { type: 'string' },
    cursor: { type: 'string' },
    limit: { type: 'number' },
  },
};

const getFollowshipSchema_params = {
  type: 'object',
  required: ['followshipID'],
  properties: {
    followshipID: { type: 'string' },
  },
};

const newFollowshipSchema_body = {
  type: 'object',
  required: ['following'],
  properties: {
    following: { type: 'string' },
  },
};

const followshipDeleteSchema_params = {
  type: 'object',
  required: ['followshipID'],
  properties: {
    followshipID: { type: 'string' },
  },
};

module.exports = {
  getFollowshipsSchema_query,
  getFollowshipSchema_params,
  newFollowshipSchema_body,
  followshipDeleteSchema_params,
};
