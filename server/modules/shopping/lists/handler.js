async function getShoppingListByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, shoppingListID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLists' 'getShoppingListByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getShoppingLists(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIDs } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, shoppingListIDs });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLists' 'getShoppingLists': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLists' 'createShoppingList': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const { status, fulfilledDate, fulfilledMethod, store } = req.body;
  const { authorization } = req.headers;
  try {
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
  } catch (e) {
    global.logger.error(`'shoppingLists' 'updateShoppingList': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteShoppingList(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { shoppingListID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      authorization,
      shoppingListID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingLists' 'deleteShoppingList': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getShoppingListByID,
  getShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
};
