'use strict';

async function getRecipeCategories(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const userID = 'ade96f70-4ec5-4ab9-adfe-0645b16e1ced';
  try {
    const returner = await p.get.all({ userID, cursor, limit });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'recipeCategories' 'getRecipeCategories': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

// async function createRecipeCategory(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { name, photoURL } = req.body;
//   const { authorization } = req.headers;
//   const { customID } = req;
//   const returner = await p.create({
//     customID,
//     authorization,
//     userID: req.userID,
//     name,
//     photoURL,
//   });
//   return res.json(returner);
// }

// async function updateRecipeCategory(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { recipeCategoryID } = req.params;
//   const { authorization } = req.headers;
//   const { name, photoURL } = req.body;
//   const returner = await p.update({
//     userID: req.userID,
//     authorization,
//     recipeCategoryID,
//     name,
//     photoURL,
//   });
//   return res.json(returner);
// }

// async function deleteRecipeCategory(req, res) {
//   const db = req.client.db;
//   const p = require('./processor')({ db });
//   const { recipeCategoryID } = req.params;
//   const { authorization } = req.headers;
//   const returner = await p.delete({
//     authorization,
//     userID: req.userID,
//     recipeCategoryID,
//   });
//   return res.json(returner);
// }

module.exports = {
  getRecipeCategories,
  // createRecipeCategory,
  // updateRecipeCategory,
  // deleteRecipeCategory,
};
