async function getShoppingListIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIngredientID } = req.params;
  try {
    const returner = await p.get.by.ID({ userID: req.userID, shoppingListIngredientID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListIngredients' 'getShoppingListIngredientByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getIngredientsByShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  try {
    const returner = await p.get.by.shoppingList({ userID: req.userID, shoppingListID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListIngredients' 'getIngredientsByShoppingList': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  const { ingredientID, needMeasurement, needUnit, source } = req.body;
  const { shoppingListID } = req.params;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      shoppingListID,
      ingredientID,
      needMeasurement,
      needUnit,
      source,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListIngredients' 'createShoppingListIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updateShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIngredientID } = req.params;
  const { purchasedMeasurement, purchasedUnit, store } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      shoppingListIngredientID,
      purchasedMeasurement,
      purchasedUnit,
      store,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListIngredients' 'updateShoppingListIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIngredientID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      authorization,
      shoppingListIngredientID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListIngredients' 'deleteShoppingListIngredient': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getShoppingListIngredientByID,
  getIngredientsByShoppingList,
  createShoppingListIngredient,
  updateShoppingListIngredient,
  deleteShoppingListIngredient,
};
