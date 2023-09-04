const newPhotoURLSchema_body = {
  type: 'object',
  required: ['fileName', 'fileType'],
  properties: {
    fileName: { type: 'string' },
    fileType: { type: 'string' },
  },
};

// const deleteImageSchema_body = {
//   type: 'object',
//   required: ['photoURL', 'type', 'id'],
//   properties: {
//     photoURL: { type: 'string' },
//     type: { type: 'string' },
//     id: { type: 'string' },
//   },
// };

module.exports = {
  newPhotoURLSchema_body,
  // deleteImageSchema_body,
};
