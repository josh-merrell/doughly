('use strict');

async function createPresignedURL(req, res) {
  const p = require('./processor')();
  const { fileName, fileType } = req.body;
  const returner = await p.create({
    userID: req.userID,
    fileName,
    fileType,
  });
  console.log(`RETURNER: ${returner}`)
  return res.json(returner);
}

module.exports = {
  createPresignedURL,
};
