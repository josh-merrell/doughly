async function getShoppingListRecipeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListRecipeID } = req.params;
  try {
    const returner = await p.get.by.ID({ userID: req.userID, shoppingListRecipeID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListRecipes' 'getShoppingListRecipeByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getRecipesByShoppingList(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListID } = req.params;
  try {
    const returner = await p.get.by.shoppingList({ userID: req.userID, shoppingListID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListRecipes' 'getRecipesByShoppingList': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createShoppingListRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const { customID } = req;
  const { recipeID, plannedDate } = req.body;
  const { shoppingListID } = req.params;
  try {
    const returner = await p.create({
      customID,
      authorization,
      userID: req.userID,
      shoppingListID,
      recipeID,
      plannedDate,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListRecipes' 'createShoppingListRecipe': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deleteShoppingListRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { shoppingListRecipeID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      userID: req.userID,
      authorization,
      shoppingListRecipeID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'shoppingListRecipes' 'deleteShoppingListRecipe': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getShoppingListRecipeByID,
  getRecipesByShoppingList,
  createShoppingListRecipe,
  deleteShoppingListRecipe,
};
