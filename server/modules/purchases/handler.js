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

async function newPurchaseRevenueCatSubPackage(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { activeEntitlements, revenueCatSubPackage } = req.body;
  const returner = await p.newPurchaseRevenueCatSubPackage({
    userID: req.userID,
    activeEntitlements,
    revenueCatPackage: revenueCatSubPackage
  });
  return res.json(returner);
}

async function newPurchaseRevenueCatProdPackage(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { activeEntitlements, revenueCatProduct } = req.body;
  const returner = await p.newPurchaseRevenueCatProdPackage({
    userID: req.userID,
    activeEntitlements,
    revenueCatProduct
  });
  return res.json(returner);
}

async function updateEntitlementsRevenueCat(req, res) {
  const db = req.client.db;
  const dbDefault = req.defaultClient.db;
  const p = require('./processor')({ db, dbDefault });
  const { entitlements } = req.body;
  const returner = await p.updateEntitlementsRevenueCat({
    userID: req.userID,
    entitlements,
  });
  return res.json(returner);
}

module.exports = {
  processNewPurchase,
  updatePermissions,
  newPurchaseRevenueCatSubPackage,
  newPurchaseRevenueCatProdPackage,
  updateEntitlementsRevenueCat,
};
