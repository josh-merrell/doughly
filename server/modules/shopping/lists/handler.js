async function getShoppingListByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, shoppingListID });
  return res.json(returner);
}

async function getShoppingLists(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIDs } = req.query;
  const returner = await p.get.all({ userID: req.userID, shoppingListIDs });
  return res.json(returner);
}

async function getSharedShoppingLists(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const returner = await p.get.shared({ userID: req.userID });
  return res.json(returner);
}

async function createShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
  });
  return res.json(returner);
}

async function updateShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const { status, fulfilledDate, fulfilledMethod, store } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    shoppingListID,
    status,
    fulfilledDate,
    fulfilledMethod,
    store,
  });
  return res.json(returner);
}

async function deleteShoppingList(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { shoppingListID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    shoppingListID,
  });
  return res.json(returner);
}

async function shareList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const { invitedUserID } = req.body;
  const { authorization } = req.headers;
  const returner = await p.share({
    userID: req.userID,
    authorization,
    shoppingListID,
    invitedUserID,
  });
  return res.json(returner);
}

async function unshareList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const { invitedUserID } = req.body;
  const { authorization } = req.headers;
  const returner = await p.unshare({
    userID: req.userID,
    authorization,
    shoppingListID,
    invitedUserID,
  });
  return res.json(returner);
}

async function receiveItems(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  let userID;
  if (req.body.userID) {
    userID = req.body.userID;
  } else {
    userID = req.userID;
  }
  const { items, store, purchasedBy } = req.body;
  const { authorization } = req.headers;
  const returner = await p.receiveItems({
    authorization,
    shoppingListID,
    purchasedBy,
    userID,
    store,
    items,
  });
  return res.json(returner);
}

module.exports = {
  getShoppingListByID,
  getShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  getSharedShoppingLists,
  shareList,
  unshareList,
  receiveItems,
};
