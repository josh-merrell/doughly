'use strict';

async function getRecipeCategories(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const returner = await p.get.all({ cursor, limit });
  return res.json(returner);
}

async function createRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { name } = req.body;
  const returner = await p.create({
    name,
  });
  return res.json(returner);
}

async function updateRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeCategoryID } = req.params;
  const { name } = req.body;
  const returner = await p.update({
    recipeCategoryID,
    name,
  });
  return res.json(returner);
}

async function deleteRecipeCategory(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeCategoryID } = req.params;
  const returner = await p.delete({
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
