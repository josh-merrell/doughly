'use strict';

async function getRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit, recipeIDs, title, recipeCategoryID } = req.query;
  const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeIDs, title, recipeCategoryID });
  return res.json(returner);
}

async function getDiscoverRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  const returner = await p.get.discover({ userID: req.userID, cursor, limit });
  return res.json(returner);
}

async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const returner = await p.get.ingredients({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeTools(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const returner = await p.get.tools({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeSteps(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const returner = await p.get.steps({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, recipeID });
  return res.json(returner);
}

async function getRecipeSubscriptions(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  const returner = await p.get.subscriptions({ userID: req.userID, authorization });
  return res.json(returner);
}

async function subscriptionsByRecipeID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const returner = await p.get.subscriptionsByRecipeID({ recipeID, userID: req.userID });
  return res.json(returner);
}

async function createRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type, sourceAuthor, sourceURL } = req.body;
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
    sourceAuthor,
    sourceURL,
  });
  return res.json(returner);
}

async function createRecipeVision(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeSourceImageURL, recipePhotoURL } = req.body;
  const { authorization } = req.headers;
  const returner = await p.createVision({
    authorization,
    userID: req.userID,
    recipeSourceImageURL,
    recipePhotoURL,
  });
  return res.json(returner);
}

async function createRecipeFromURL(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeURL, recipePhotoURL } = req.body;
  const { authorization } = req.headers;
  const returner = await p.createFromURL({
    authorization,
    userID: req.userID,
    recipeURL,
    recipePhotoURL,
  });
  return res.json(returner);
}

async function updateRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
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
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    authorization,
    userID: req.userID,
    recipeID,
  });
  return res.json(returner);
}

async function useRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const { satisfaction, difficulty, note, checkIngredientStock } = req.body;
  const { authorization } = req.headers;
  const returner = await p.use({
    authorization,
    userID: req.userID,
    recipeID,
    satisfaction: parseInt(satisfaction),
    difficulty: parseInt(difficulty),
    note,
    checkIngredientStock,
  });
  return res.json(returner);
}

async function constructRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { title, sourceRecipeID, servings, recipeCategoryID, lifespanDays, timePrep, timeBake, photoURL, type, components, ingredients, tools, steps, sourceAuthor, sourceURL } = req.body;
  const { authorization } = req.headers;
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
    sourceAuthor,
    sourceURL,
  });
  return res.json(returner);
}

async function subscribeRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
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
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { subscriptionID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.unsubscribe({
    authorization,
    userID: req.userID,
    subscriptionID,
  });
  return res.json(returner);
}

async function archiveCreatedRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const recipeIDs = req.body.recipeIDs;
  const p = require('./processor')({ db, dbPublic });
  const returner = await p.archiveCreatedRecipes({ userID: req.userID, recipeIDs });
  return res.json(returner);
}

async function archiveSubscriptions(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const subscriptionIDs = req.body.subscriptionIDs;
  const p = require('./processor')({ db, dbPublic });
  const returner = await p.archiveSubscriptions({ userID: req.userID, subscriptionIDs });
  return res.json(returner);
}

module.exports = {
  subscriptionsByRecipeID,
  getRecipes,
  getDiscoverRecipes,
  getRecipeIngredients,
  getRecipeTools,
  getRecipeSteps,
  getRecipeByID,
  getRecipeSubscriptions,
  createRecipe,
  createRecipeVision,
  createRecipeFromURL,
  updateRecipe,
  deleteRecipe,
  useRecipe,
  constructRecipe,
  subscribeRecipe,
  unsubscribeRecipe,
  archiveCreatedRecipes,
  archiveSubscriptions,
};
