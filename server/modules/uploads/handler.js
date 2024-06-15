('use strict');

async function createPresignedURL(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { type, fileName, fileType } = req.body;
  const returner = await p.create({
    userID: req.userID,
    type,
    fileName,
    fileType,
  });
  return res.json(returner);
}

async function deleteS3Photo(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { photoURL, type, id } = req.query;
  const returner = await p.remove({
    userID: req.userID,
    photoURL,
    type,
    id: id ? parseInt(id, 10) : undefined,
  });
  return res.json(returner);
}

module.exports = {
  createPresignedURL,
  deleteS3Photo,
};
