'use strict';

async function getRecipes(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit, recipeIDs, title, recipeCategoryID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeIDs, title, recipeCategoryID });
  return res.json(returner);
}

async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.ingredients({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeTools(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.tools({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeSteps(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.steps({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeSubscriptions(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { authorization } = req.headers;
  const returner = await p.get.subscriptions({ userID: req.userID, authorization });
  return res.json(returner);
}

async function subscriptionsByRecipeID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const returner = await p.get.subscriptionsByRecipeID({ recipeID });
  return res.json(returner);
}

async function createRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.create({
    customID,
    authorization,
    userID: req.userID,
    title,
    servings,
    lifespanDays,
    recipeCategoryID,
    type,
    timePrep,
    timeBake,
    photoURL,
  });
  return res.json(returner);
}

async function updateRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const { authorization } = req.headers;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    recipeID,
    recipeCategoryID,
    title,
    type,
    servings,
    lifespanDays,
    timePrep,
    timeBake,
    photoURL,
  });
  return res.json(returner);
}

async function deleteRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    authorization,
    userID: req.userID,
    recipeID,
  });
  return res.json(returner);
}

async function useRecipe(req, res, next) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { recipeID } = req.params;
  const { satisfaction, difficulty, note } = req.body;
  const { authorization } = req.headers;

  try {
    const returner = await p.use({
      authorization,
      userID: req.userID,
      recipeID,
      satisfaction: parseInt(satisfaction),
      difficulty: parseInt(difficulty),
      note,
    });
    return res.json(returner);
  } catch (err) {
    // handle the error, for example, log it and send a response
    global.logger.error(`'recipes' 'useRecipe': ${err.message}`);
    // If you have a specific error format or a specific status code, use them here
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function constructRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { title, sourceRecipeID, servings, recipeCategoryID, lifespanDays, timePrep, timeBake, photoURL, type, components, ingredients, tools, steps } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.constructRecipe({
    authorization,
    userID: req.userID,
    sourceRecipeID,
    recipeCategoryID,
    title,
    servings,
    lifespanDays,
    type,
    timePrep,
    timeBake,
    photoURL,
    components,
    ingredients,
    tools,
    steps,
  });
  return res.json(returner);
}

async function subscribeRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { sourceRecipeID, newRecipeID } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  const returner = await p.subscribe({
    authorization,
    userID: req.userID,
    customID,
    sourceRecipeID,
    newRecipeID,
  });
  return res.json(returner);
}

async function unsubscribeRecipe(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { subscriptionID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.unsubscribe({
    authorization,
    userID: req.userID,
    subscriptionID,
  });
  return res.json(returner);
}

module.exports = {
  subscriptionsByRecipeID,
  getRecipes,
  getRecipeIngredients,
  getRecipeTools,
  getRecipeSteps,
  getRecipeByID,
  getRecipeSubscriptions,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  useRecipe,
  constructRecipe,
  subscribeRecipe,
  unsubscribeRecipe,
};
