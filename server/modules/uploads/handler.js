('use strict');

async function createPresignedURL(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { type, fileName, fileType } = req.body;
  try {
    const returner = await p.create({
      userID: req.userID,
      type,
      fileName,
      fileType,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'uploads' 'createPresignedURL': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteS3Photo(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { photoURL, type, id } = req.query;

  try {
    const returner = await p.remove({
      userID: req.userID,
      photoURL,
      type,
      id: id ? parseInt(id, 10) : undefined,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'uploads' 'deleteS3Photo': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}


module.exports = {
  createPresignedURL,
  deleteS3Photo,
};
