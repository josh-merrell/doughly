('use strict');

async function processNewPurchase(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const { transaction, sku } = req.body;
  const p = require('./processor')({ db, dbDefault });
  const returner = await p.processNewPurchase({
    userID: req.userID,
    transaction,
    sku,
  });
  return res.json(returner);
}

async function updatePermissions(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { permissions } = req.body;
  const returner = await p.updatePermissions({
    userID: req.userID,
    permissions,
  });
  return res.json(returner);
}

module.exports = {
  processNewPurchase,
  updatePermissions,
};
