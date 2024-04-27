const newPhotoURLSchema_body = {
  type: 'object',
  required: ['type', 'fileName', 'fileType'],
  properties: {
    type: { type: 'string'},
    fileName: { type: 'string' },
    fileType: { type: 'string' },
  },
};

module.exports = {
  newPhotoURLSchema_body,
};
