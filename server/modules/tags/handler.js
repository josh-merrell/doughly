'use strict';

async function getTags(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, tagIDs, name } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, tagIDs, name });
  return res.json(returner);
}

async function getTagByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, tagID });
  return res.json(returner);
}

async function createTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name } = req.body;
  const returner = await p.create({
    userID: req.userID,
    name,
  });
  return res.json(returner);
}

async function updateTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const { name } = req.body;
  const returner = await p.update({
    userID: req.userID,
    tagID,
    name,
  });
  return res.json(returner);
}

async function deleteTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    tagID,
  });
  return res.json(returner);
}

module.exports = {
  getTags,
  getTagByID,
  createTag,
  updateTag,
  deleteTag,
};
