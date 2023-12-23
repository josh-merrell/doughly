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

async function createShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  console.log(`CREATING LIST: ${customID} ${authorization} ${req.userID}`)
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
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    shoppingListID,
  });
  return res.json(returner);
}

module.exports = {
  getShoppingListByID,
  getShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList
}