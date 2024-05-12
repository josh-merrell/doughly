('use strict');

async function processNewPurchase(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const { transaction, sku } = req.body;
  const p = require('./processor')({ db, dbDefault });
  try {
    const returner = await p.create({
      userID: req.userID,
      transaction,
      sku,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'purchases' 'processNewPurchase': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updatePermissions(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { permissions } = req.body;
  try {
    const returner = await p.updatePermissions({
      userID: req.userID,
      permissions,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'purchases' 'updatePermissions': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  processNewPurchase,
  updatePermissions,
};
