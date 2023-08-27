const newPhotoURLSchema_body = {
  type: 'object',
  required: ['fileName', 'fileType'],
  properties: {
    fileName: { type: 'string' },
    fileType: { type: 'string' },
  },
};

module.exports = {
  newPhotoURLSchema_body,
};
