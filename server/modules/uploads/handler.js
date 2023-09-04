('use strict');

async function createPresignedURL(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { fileName, fileType } = req.body;
  const returner = await p.create({
    userID: req.userID,
    fileName,
    fileType,
  });
  return res.json(returner);
}

async function deleteS3Photo(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { photoURL, type, id } = req.body;
  const returner = await p.remove({
    userID: req.userID,
    photoURL,
    type,
    id,
  });
  return res.json(returner);
}

module.exports = {
  createPresignedURL,
  deleteS3Photo,
};
