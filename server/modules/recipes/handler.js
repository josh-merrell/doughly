'use strict';

async function getRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit, recipeIDs, title, recipeCategoryID } = req.query;
  try {
    const returner = await p.get.all({ userID: req.userID, cursor, limit, recipeIDs, title, recipeCategoryID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipes': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getDiscoverRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { cursor, limit } = req.query;
  try {
    const returner = await p.get.discover({ userID: req.userID, cursor, limit });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getDiscoverRecipes': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getRecipeIngredients(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.ingredients({ userID: req.userID, recipeID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipeIngredients': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getRecipeTools(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.tools({ userID: req.userID, recipeID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipeTools': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getRecipeSteps(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.steps({ userID: req.userID, recipeID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipeSteps': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getRecipeByID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.byID({ userID: req.userID, recipeID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipeByID': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function getRecipeSubscriptions(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { authorization } = req.headers;
  try {
    const returner = await p.get.subscriptions({ userID: req.userID, authorization });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'getRecipeSubscriptions': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function subscriptionsByRecipeID(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  try {
    const returner = await p.get.subscriptionsByRecipeID({ recipeID });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'subscriptionsByRecipeID': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function createRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
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
  } catch (err) {
    global.logger.error(`'recipes' 'createRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function createRecipeVision(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeSourceImageURL, recipePhotoURL } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.createVision({
      authorization,
      userID: req.userID,
      recipeSourceImageURL,
      recipePhotoURL,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'createRecipeVision': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function createRecipeFromURL(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeURL, recipePhotoURL } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.createFromURL({
      authorization,
      userID: req.userID,
      recipeURL,
      recipePhotoURL,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'createRecipeFromURL': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function updateRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const { title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = req.body;
  const { authorization } = req.headers;
  try {
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
  } catch (err) {
    global.logger.error(`'recipes' 'updateRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function deleteRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({
      authorization,
      userID: req.userID,
      recipeID,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'deleteRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function useRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { recipeID } = req.params;
  const { satisfaction, difficulty, note, checkIngredientStock } = req.body;
  const { authorization } = req.headers;

  try {
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
  } catch (err) {
    // handle the error, for example, log it and send a response
    global.logger.error(`'recipes' 'useRecipe': ${err.message}`);
    // If you have a specific error format or a specific status code, use them here
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function constructRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { title, sourceRecipeID, servings, recipeCategoryID, lifespanDays, timePrep, timeBake, photoURL, type, components, ingredients, tools, steps } = req.body;
  const { authorization } = req.headers;
  try {
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
  } catch (err) {
    global.logger.error(`'recipes' 'constructRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function subscribeRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { sourceRecipeID, newRecipeID } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.subscribe({
      authorization,
      userID: req.userID,
      customID,
      sourceRecipeID,
      newRecipeID,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'subscribeRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function unsubscribeRecipe(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const p = require('./processor')({ db, dbPublic });
  const { subscriptionID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.unsubscribe({
      authorization,
      userID: req.userID,
      subscriptionID,
    });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'unsubscribeRecipe': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function archiveCreatedRecipes(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const recipeIDs = req.body.recipeIDs;
  const p = require('./processor')({ db, dbPublic });
  try {
    const returner = await p.archiveCreatedRecipes({ userID: req.userID, recipeIDs });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'archiveCreatedRecipes': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
}

async function archiveSubscriptions(req, res) {
  const db = req.client.db;
  const dbPublic = req.defaultClient.db;
  const subscriptionIDs = req.body.subscriptionIDs;
  const p = require('./processor')({ db, dbPublic });
  try {
    const returner = await p.archiveSubscriptions({ userID: req.userID, subscriptionIDs });
    return res.json(returner);
  } catch (err) {
    global.logger.error(`'recipes' 'archiveSubscriptions': ${err.message}`);
    return res.status(err.code || 500).json({ error: err.message });
  }
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
