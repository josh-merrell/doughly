'use strict';

async function getTags(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, tagIDs, name } = req.query;
  const returner = await p.get.all({ cursor, limit, tagIDs, name });
  return res.json(returner);
}

async function getTagByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.get.byID({ tagID });
  return res.json(returner);
}

async function createTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name } = req.body;
  const returner = await p.create({
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
