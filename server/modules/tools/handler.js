'use strict';

async function getTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolIDs, name } = req.query;
  const returner = await p.get.all({ toolIDs, name });
  return res.json(returner);
}

async function getToolByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const returner = await p.get.byID({ toolID });
  return res.json(returner);
}

async function createTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name } = req.body;
  const returner = await p.create({
    name,
  });
  return res.json(returner);
}

async function updateTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const { name } = req.body;
  const returner = await p.update({
    toolID,
    name,
  });
  return res.json(returner);
}

async function deleteTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const returner = await p.delete({
    toolID,
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
