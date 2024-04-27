'use strict';

async function getRecipeTags(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, recipeTagIDs, recipeID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeTagIDs, recipeID });
  return res.json(returner);
}

async function getRecipeTagByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { tagID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, tagID });
  return res.json(returner);
}

async function createRecipeTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID, tagID } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    recipeID,
    tagID,
  });
  return res.json(returner);
}

async function deleteRecipeTag(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeTagID } = req.params;
  const returner = await p.delete({
    userID: req.userID,
    recipeTagID,
  });
  return res.json(returner);
}

module.exports = {
  getRecipeTags,
  getRecipeTagByID,
  createRecipeTag,
  deleteRecipeTag,
};
