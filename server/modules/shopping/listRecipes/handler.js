async function getShoppingListRecipeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListRecipeID } = req.params;
  const returner = await p.get.by.ID({ userID: req.userID, shoppingListRecipeID });
  return res.json(returner);
}

async function getRecipesByShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  const returner = await p.get.by.shoppingList({ userID: req.userID, shoppingListID });
  return res.json(returner);
}

async function getAllShoppingListRecipes(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const returner = await p.get.all({ userID: req.userID });
  return res.json(returner);
}

async function createShoppingListRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  const { recipeID, plannedDate } = req.body;
  const { shoppingListID } = req.params;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    shoppingListID,
    recipeID,
    plannedDate,
  });
  return res.json(returner);
}

async function deleteShoppingListRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListRecipeID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    authorization,
    shoppingListRecipeID,
  });
  return res.json(returner);
}

module.exports = {
  getShoppingListRecipeByID,
  getRecipesByShoppingList,
  getAllShoppingListRecipes,
  createShoppingListRecipe,
  deleteShoppingListRecipe,
};
