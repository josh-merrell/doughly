const getFriendshipsSchema_query = {
  type: 'object',
  properties: {
    friendIDs: { type: 'array', items: { type: 'number' } },
    name: { type: 'string' },
    sourceUserID: { type: 'string' },
    cursor: { type: 'string' },
    limit: { type: 'number' },
  },
};

const getFriendshipSchema_params = {
  type: 'object',
  required: ['friendshipID'],
  properties: {
    friendshipID: { type: 'string' },
  },
};

const newFriendshipSchema_body = {
  type: 'object',
  required: ['friend'],
  properties: {
    friend: { type: 'string' },
    status: { type: 'string' },
  },
};

const friendshipUpdateSchema_body = {
  type: 'object',
  properties: {
    status: { type: 'string' },
  },
};

const friendshipUpdateSchema_params = {
  type: 'object',
  required: ['friendshipID'],
  properties: {
    friendshipID: { type: 'string' },
  },
};

const friendshipDeleteSchema_params = {
  type: 'object',
  required: ['friendshipID'],
  properties: {
    friendshipID: { type: 'string' },
  },
};

module.exports = {
  getFriendshipsSchema_query,
  getFriendshipSchema_params,
  newFriendshipSchema_body,
  friendshipUpdateSchema_body,
  friendshipUpdateSchema_params,
  friendshipDeleteSchema_params,
};
