'use strict';

async function getTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolIDs, name, brand } = req.query;
  const returner = await p.get.all({ userID: req.userID, toolIDs, name, brand });
  return res.json(returner);
}

async function getToolByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, toolID });
  return res.json(returner);
}

async function createTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, brand } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    name,
    brand,
  });
  return res.json(returner);
}

async function updateTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const { authorization } = req.headers;
  const { name, brand } = req.body;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    toolID,
    name,
    brand,
  });
  return res.json(returner);
}

async function deleteTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    toolID,
    authorization,
  });
  return res.json(returner);
}

module.exports = {
  getTools,
  getToolByID,
  createTool,
  updateTool,
  deleteTool,
};
