'use strict';

async function getTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolIDs, name, brand } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, toolIDs, name, brand });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'tools' 'getTools': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getToolByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, toolID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'tools' 'getToolByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, brand } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      name,
      brand,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'tools' 'createTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const { authorization } = req.headers;
  const { name, brand } = req.body;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      toolID,
      name,
      brand,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'tools' 'updateTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteTool(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      toolID,
      authorization,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'tools' 'deleteTool': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getTools,
  getToolByID,
  createTool,
  updateTool,
  deleteTool,
};
