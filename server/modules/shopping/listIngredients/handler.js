async function getShoppingListIngredientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIngredientID } = req.params;
  const returner = await p.get.by.ID({ userID: req.userID, shoppingListIngredientID });
  return res.json(returner);
}

async function getDisplayIngredientsByShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const returner = await p.get.by.shoppingListDisplay({ userID: req.userID, shoppingListID });
  return res.json(returner);
}

async function getIngredientsByShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const returner = await p.get.by.shoppingList({ userID: req.userID, shoppingListID });
  return res.json(returner);
}

async function createShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  const { ingredientID, needMeasurement, needUnit, source } = req.body;
  const { shoppingListID } = req.params;
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
}

async function updateShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  let userID;
  if (req.body.userID) {
    userID = req.body.userID;
  } else {
    userID = req.userID;
  }
  const { shoppingListIngredientID } = req.params;
  const { purchasedBy, purchasedMeasurement, purchasedUnit, store } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID,
    purchasedBy,
    authorization,
    shoppingListIngredientID,
    purchasedMeasurement,
    purchasedUnit,
    store,
  });
  return res.json(returner);
}

async function deleteShoppingListIngredient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListIngredientID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    shoppingListIngredientID,
  });
  return res.json(returner);
}

module.exports = {
  getShoppingListIngredientByID,
  getDisplayIngredientsByShoppingList,
  getIngredientsByShoppingList,
  createShoppingListIngredient,
  updateShoppingListIngredient,
  deleteShoppingListIngredient,
};
