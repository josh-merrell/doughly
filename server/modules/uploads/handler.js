('use strict');

async function createPresignedURL(req, res) {
  const p = require('./processor')();
  const { fileName, fileType } = req.body;
  const returner = await p.create({
    userID: req.userID,
    fileName,
    fileType,
  });
  return res.json(returner);
}

async function deleteS3Photo(req, res) {
  const p = require('./processor')();
  const { photoURL } = req.body;
  const returner = await p.remove({
    userID: req.userID,
    photoURL,
  });
  return res.json(returner);
}

module.exports = {
  createPresignedURL,
  deleteS3Photo,
};
