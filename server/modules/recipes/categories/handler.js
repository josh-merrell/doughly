'use strict';

async function getRecipeCategories(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit });
  return res.json(returner);
}

async function createRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name, photoURL } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    name,
    photoURL,
  });
  return res.json(returner);
}

async function updateRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeCategoryID } = req.params;
  const { name, photoURL } = req.body;
  const returner = await p.update({
    userID: req.userID,
    recipeCategoryID,
    name,
    photoURL,
  });
  return res.json(returner);
}

async function deleteRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeCategoryID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    authorization,
    userID: req.userID,
    recipeCategoryID,
  });
  return res.json(returner);
}

module.exports = {
  getRecipeCategories,
  createRecipeCategory,
  updateRecipeCategory,
  deleteRecipeCategory,
};
