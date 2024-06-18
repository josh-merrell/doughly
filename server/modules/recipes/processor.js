/* eslint-disable max-len */
('use strict');

const { default: axios } = require('axios');
const { createRecipeLog, createRecipeFeedbackLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { supplyCheckRecipe, useRecipeIngredients } = require('../../services/supply');
const { errorGen } = require('../../middleware/errorHandling');
const { visionRequest, recipeFromTextRequest, matchRecipeItemRequest, matchRecipeIngredientRequest } = require('../../services/aiHandlers.js');
const { getUnitRatio } = require('../../services/unitRatioStoreService');
const { getHtml, extractFromHtml } = require('../../services/scraper');
const { sendSSEMessage } = require('../../server.js');
// const path = require('path');
// const fs = require('fs');

module.exports = ({ db, dbPublic }) => {
  async function constructRecipe(options) {
    const { sourceRecipeID, recipeCategoryID, authorization, userID, title, servings, lifespanDays, type = 'subscription', timePrep, timeBake, photoURL, ingredients, tools, steps } = options;

    try {
      //start timer
      const constructStartTime = new Date();
      let recipeID;
      const createdItems = [];
      //first create the recipe, save as {'recipeID': recipeID} to createdItems
      const { data: recipe, error } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/recipes`,
        {
          authorization,
          userID,
          title,
          servings,
          lifespanDays,
          type,
          timePrep,
          timeBake,
          photoURL,
          IDtype: 11,
          recipeCategoryID,
        },
        { headers: { authorization } },
      );
      if (error) {
        throw error;
      }
      recipeID = recipe.recipeID;

      const uniqueNameIngredients = {};
      ingredients.map((i) => {
        if (!uniqueNameIngredients[i.name]) {
          uniqueNameIngredients[i.name] = { ingredients: [i], ingredientID: 0 };
        } else {
          uniqueNameIngredients[i.name]['ingredients'].push(i);
        }
      });
      global.logger.info({ message: `UNIQUE NAME INGREDIENTS: ${JSON.stringify(uniqueNameIngredients)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      const ingredientIDPromises = [];
      for (const [name, value] of Object.entries(uniqueNameIngredients)) {
        // first get 'ingredientID' for each group of ingredients with the same name using 'getIngredientID' endpoint
        ingredientIDPromises.push(
          getIngredientID(name, value.ingredients, userID, authorization).then((ingredientID) => {
            value.ingredientID = ingredientID;
          }),
        );
      }
      await Promise.allSettled(ingredientIDPromises);
      global.logger.info({ message: `UNIQUE NAME INGREDIENTS AFTER GETTING INGREDIENTID: ${JSON.stringify(uniqueNameIngredients)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      // then create recipeIngredients for each ingredient group
      const ingredientPromises = [];
      for (const [, value] of Object.entries(uniqueNameIngredients)) {
        for (let i = 0; i < value.ingredients.length; i++) {
          value.ingredients[i].ingredientID = value.ingredientID;
          ingredientPromises.push(constructRecipeIngredient(value.ingredients[i], authorization, userID, recipe.recipeID));
        }
      }

      const ingredientResults = await Promise.allSettled(ingredientPromises);
      for (const result of ingredientResults) {
        if (result.status === 'fulfilled') {
          createdItems.push({ ingredientID: result.value.ingredientID });
        } else {
          throw errorGen(`constructRecipe' Failed when creating recipeIngredients. Rolled-back. Failure: ${result.reason}`, 515, 'cannotComplete', false, 3);
        }
      }

      if (!tools.length) {
        // dummy recipeTool case
        await constructRecipeTool({ quantity: -1 }, authorization, userID, recipe.recipeID);
      } else {
        const toolPromises = tools.map((t) => constructRecipeTool(t, authorization, userID, recipe.recipeID));
        const toolResults = await Promise.allSettled(toolPromises);
        for (const result of toolResults) {
          if (result.status === 'fulfilled') {
            createdItems.push({ toolID: result.value.toolID });
          } else {
            throw errorGen(`constructRecipe' Failed when creating recipeTools. Rolled-back. Failure: ${result.reason}`, 515, 'cannotComplete', false, 3);
          }
        }
      }

      const stepPromises = steps.map((s) => constructRecipeStep(s, authorization, userID, recipe.recipeID));
      const stepResults = await Promise.allSettled(stepPromises);
      for (const result of stepResults) {
        if (result.status === 'fulfilled') {
          createdItems.push({ stepID: result.value.stepID });
        } else {
          throw errorGen(`constructRecipe' Failed when creating recipeSteps. Rolled-back. Failure: ${result.reason}`, 515, 'cannotComplete', false, 3);
        }
      }

      // if this is a subscription, create a recipeSubscription and sync the version of new recipe to match source recipe
      if (type === 'subscription') {
        //make axios call to add recipeSubscription
        const { data: subscriptionID, error: subscriptionError } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/recipes/subscribe`,
          {
            authorization,
            userID,
            IDtype: 25,
            sourceRecipeID: sourceRecipeID,
            newRecipeID: recipe.recipeID,
          },
          { headers: { authorization } },
        );
        if (subscriptionError) {
          throw errorGen(
            subscriptionError.message || `'constructRecipe' Failed when creating recipeSubscription. Failure: ${subscriptionError}`,
            subscriptionError.code || 520,
            subscriptionError.name || 'unhandledError_recipeCategories-getAll',
            subscriptionError.isOperational || false,
            subscriptionError.severity || 2,
          );
        }
        createdItems.push({ subscriptionID: subscriptionID });

        //get current version of source recipe and update newRecipe version to match
        const { data: sourceRecipe, error: sourceRecipeError } = await db.from('recipes').select('version').eq('recipeID', sourceRecipeID).eq('deleted', false).single();
        if (sourceRecipeError) {
          throw errorGen(`'constructRecipe' Failed when getting sourceRecipe. Failure: ${sourceRecipeError}`, 511, 'failSupabaseSelect', true, 3);
        }
        const { error: updateError } = await db.from('recipes').update({ version: sourceRecipe.version }).eq('recipeID', recipe.recipeID);
        if (updateError) {
          throw errorGen(`'constructRecipe' Failed when updating newRecipe version. Failure: ${updateError}`, 513, 'failSupabaseUpdate', true, 3);
        }
      }

      // Stop timer and calculate duration
      const constructEndTime = new Date();
      const constructDuration = constructEndTime - constructStartTime;
      global.logger.info({ message: `Successfully constructed recipe ${recipe.recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      global.logger.info({ message: `*TIME* constructRecipe: ${constructDuration / 1000} seconds`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      return { recipeID: recipe.recipeID };
    } catch (error) {
      //rollback any created recipe items (the API endpoint will delete associated recipeIngredients, recipeTools, and recipeSteps)
      if (recipeID) {
        await deleteItem({ recipeID: recipeID }, authorization);
        for (let i in createdItems) {
          deleteItem(createdItems[i], authorization);
        }
      }
      throw errorGen(error.message || 'Unhandled Error in recipes constructRecipe', error.code || 520, error.name || 'unhandledError_recipe-constructRecipe', error.isOperational || false, error.severity || 2);
    }
  }

  async function getIngredientID(ingredientName, ingredientGroup, userID, authorization) {
    try {
      let ingredientID = 0;
      // look through ingredientGroup for any with a non-zero ingredientID. If found, return that ingredientID
      for (let i = 0; i < ingredientGroup.length; i++) {
        if (ingredientGroup[i].ingredientID !== 0) {
          return ingredientGroup[i].ingredientID;
        }
      }
      // if none found, need to create a new ingredient
      const body = {
        authorization,
        userID,
        IDtype: 12,
        name: ingredientName,
        lifespanDays: Math.round(Number(ingredientGroup[0].lifespanDays)),
        purchaseUnit: ingredientGroup[0].purchaseUnit,
        gramRatio: Number(ingredientGroup[0].gramRatio),
      };
      if (ingredientGroup[0].brand) {
        body.brand = ingredientGroup[0].brand;
      }
      if (ingredientGroup[0].needsReview) {
        body.needsReview = ingredientGroup[0].needsReview;
      }
      const { data } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients`, body, { headers: { authorization } });
      ingredientID = Number(data.ingredientID);
      global.logger.info({ message: `CREATED ING, NOW INGREDIENTID IS: ${ingredientID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // return ingredientID
      return ingredientID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getIngredientID', err.code || 520, err.name || 'unhandledError_recipes-getIngredientID', err.isOperational || false, err.severity || 2);
    }
  }

  async function constructRecipeIngredient(ingredient, authorization, userID, recipeID) {
    try {
      global.logger.info({ message: `CONSTRUCT RI: ${JSON.stringify(ingredient)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      if (!ingredient.ingredientID || ingredient.ingredientID === 0) {
        throw errorGen(`'constructRecipeIngredient' ingredientID is 0. Cannot create recipeIngredient without a valid ingredientID`, 510, 'dataValidationErr', false, 3);
      }
      // Then, create the recipeIngredient
      global.logger.info({
        message: `CALLING RI CREATE WITH BODY: ${JSON.stringify({
          recipeID,
          ingredientID: ingredient.ingredientID,
          measurementUnit: ingredient.measurementUnit,
          measurement: ingredient.measurement,
          purchaseUnitRatio: ingredient.purchaseUnitRatio,
          preparation: ingredient.preparation,
          component: ingredient.component,
          RIneedsReview: ingredient.RIneedsReview || false,
        })}`,
        level: 7,
        timestamp: new Date().toISOString(),
        userID: userID,
      });
      const { data } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe`,
        {
          authorization,
          userID,
          IDtype: 16,
          recipeID,
          ingredientID: ingredient.ingredientID,
          measurementUnit: ingredient.measurementUnit,
          measurement: ingredient.measurement,
          purchaseUnitRatio: ingredient.purchaseUnitRatio,
          preparation: ingredient.preparation,
          component: ingredient.component,
          RIneedsReview: ingredient.RIneedsReview || false,
        },
        { headers: { authorization } },
      );
      return { recipeIngredientID: data.recipeIngredientID, ingredientID: ingredient.ingredientID };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes constructRecipeIngredient', err.code || 520, err.name || 'unhandledError_recipes-constructRecipeIngredient', err.isOperational || false, err.severity || 2);
    }
  }

  async function constructRecipeTool(tool, authorization, userID, recipeID) {
    try {
      global.logger.info({ message: `CONSTRUCT RT: ${tool}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      let toolID;
      if (tool.quantity === -1) {
        // create dummy recipeTool
        const { data } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/tools/recipe`,
          {
            authorization,
            userID,
            IDtype: 17,
            recipeID,
            toolID: 0,
            quantity: tool.quantity,
          },
          { headers: { authorization } },
        );
        global.logger.info({ message: `RETURNING DUMMY RT: ${data}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        return { recipeToolID: data.recipeToolID, toolID: toolID };
      }

      if (Number(tool.toolID) === 0) {
        // If toolID is not provided, create a new tool
        const { data } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/tools`,
          {
            authorization,
            userID,
            IDtype: 14,
            name: tool.name,
            brand: tool.brand,
          },
          { headers: { authorization } },
        );
        toolID = Number(data.toolID);
        global.logger.info({ message: `CREATED TOOL, NOW TOOLID IS: ${toolID}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      } else {
        toolID = Number(tool.toolID);
        global.logger.info({ message: `EXISTING TOOLID IS: ${toolID}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      }
      // Then, create the recipeTool
      global.logger.info({
        message: `CALLING RT CREATE WITH BODY: ${JSON.stringify({
          recipeID,
          toolID,
          quantity: tool.quantity,
        })}`,
        level: 7,
        timestamp: new Date().toISOString(),
        userID: userID,
      });
      const { data } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/tools/recipe`,
        {
          authorization,
          userID,
          IDtype: 17,
          recipeID,
          toolID,
          quantity: tool.quantity,
        },
        { headers: { authorization } },
      );
      return { recipeToolID: data.recipeToolID, toolID: toolID };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes constructRecipeTool', err.code || 520, err.name || 'unhandledError_recipes-constructRecipeTool', err.isOperational || false, err.severity || 2);
    }
  }

  async function constructRecipeStep(step, authorization, userID, recipeID) {
    try {
      let stepID;
      if (step.stepID === 0) {
        // if stepID is not provided, create a new step
        const { data } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/steps`,
          {
            authorization,
            userID,
            IDtype: 18,
            title: step.title,
            description: step.description,
          },
          { headers: { authorization } },
        );
        stepID = data.stepID;
      } else {
        stepID = step.stepID;
      }
      // Then, create the recipeStep
      const body = {
        authorization,
        userID,
        IDtype: 19,
        recipeID,
        stepID,
        sequence: step.sequence,
      };
      if (step.photoURL) {
        body.photoURL = step.photoURL;
      }
      const { data } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/steps/recipe`, body, { headers: { authorization } });
      return { recipeStepID: data.recipeStepID, stepID: stepID };
    } catch (error) {
      if (stepID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/steps/${stepID}`, {
          headers: {
            authorization,
          },
        });
      }
      throw errorGen(error.message || 'Unhandled Error in recipes constructRecipeStep', error.code || 520, error.name || 'unhandledError_recipes-constructRecipeStep', error.isOperational || false, error.severity || 2);
    }
  }

  async function deleteItem(item, authorization) {
    try {
      if (item.recipeID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${item.recipeID}`, {
          headers: {
            authorization,
          },
        });
      } else if (item.subscriptionID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/subscribe/${item.subscriptionID}`, {
          headers: {
            authorization,
          },
        });
      } else if (item.ingredientID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/${item.ingredientID}`, {
          headers: {
            authorization,
          },
        });
      } else if (item.toolID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/tools/${item.toolID}`, {
          headers: {
            authorization,
          },
        });
      } else if (item.stepID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/steps/${item.stepID}`, {
          headers: {
            authorization,
          },
        });
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes deleteItem', err.code || 520, err.name || 'unhandledError_recipes-deleteItem', err.isOperational || false, err.severity || 2);
    }
  }

  async function getAll(options) {
    const { userID, recipeIDs, title, recipeCategoryID } = options;

    try {
      let q = db.from('recipes').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeID', { ascending: true });
      if (recipeIDs) {
        q = q.in('recipeID', recipeIDs);
      }
      if (title) {
        q = q.like('title', title);
      }
      if (recipeCategoryID) {
        q = q.filter('recipeCategoryID', 'eq', recipeCategoryID);
      }
      const { data: recipes, error } = await q;

      if (error) {
        throw errorGen(`Error getting recipes: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${recipes.length} recipes`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipes;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getAll', err.code || 520, err.name || 'unhandledError_recipes-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getDiscover() {
    const { userID, authorization } = options;
    try {
      const { data: discoverRecipes, error } = await db.from('recipes').select().eq('discoverPage', true).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting discoverRecipes: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${discoverRecipes.length} discoverRecipes`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return discoverRecipes;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getDiscover', err.code || 520, err.name || 'unhandledError_recipes-getDiscover', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { recipeID } = options;

    try {
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipe: ${recipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got recipe`, level: 6, timestamp: new Date().toISOString(), userID: recipe[0].userID || 0 });
      return recipe;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getByID', err.code || 520, err.name || 'unhandledError_recipes-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipeIngredients(options) {
    const { recipeID } = options;

    try {
      const { data: recipeIngredients, error } = await db.from('recipeIngredients').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipeIngredients for recipeID: ${recipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${recipeIngredients.length} recipeIngredients for recipeID: ${recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: recipeIngredients[0].userID });
      return recipeIngredients;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getRecipeIngredients', err.code || 520, err.name || 'unhandledError_recipes-getRecipeIngredients', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipeTools(options) {
    const { recipeID } = options;

    try {
      const { data: recipeTools, error } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipeTools for recipeID: ${recipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: ``, level: 6, timestamp: new Date().toISOString(), userID: recipeTools[0].userID || 0 });
      return recipeTools;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getRecipeTools', err.code || 520, err.name || 'unhandledError_recipes-getRecipeTools', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipeSteps(options) {
    const { recipeID } = options;

    try {
      const { data: recipeSteps, error } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);

      if (error) {
        throw errorGen(`Error getting recipeSteps for recipeID: ${recipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `Got ${recipeSteps.length} recipeSteps for recipeID: ${recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: recipeSteps[0].userID });
      return recipeSteps;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getRecipeSteps', err.code || 520, err.name || 'unhandledError_recipes-getRecipeSteps', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipeSubscriptions(options) {
    const { userID, authorization } = options;

    try {
      const { data: subscriptions, error } = await db.from('recipeSubscriptions').select('subscriptionID, sourceRecipeID, newRecipeID, startDate').eq('userID', userID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipeSubscriptions for userID: ${userID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const enhancedSubscriptions = [];
      for (let i = 0; i < subscriptions.length; i++) {
        // get source recipe using axios endpoint
        const { data: sourceRecipe, error: sourceRecipeError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${subscriptions[i].sourceRecipeID}`, { headers: { authorization } });
        if (sourceRecipeError) {
          throw errorGen(
            sourceRecipeError.message || `Error getting sourceRecipe for subscriptionID: ${subscriptions[i].subscriptionID}: ${sourceRecipeError.message}`,
            sourceRecipeError.code || 520,
            sourceRecipeError.name || 'unhandledError_recipes-getRecipeSubscriptions',
            sourceRecipeError.isOperational || false,
            sourceRecipeError.severity || 2,
          );
        }
        global.logger.info({ message: `sourceRecipe: ${JSON.stringify(sourceRecipe[0])}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

        // get profile using axios endpoint providing userID in query
        const { data: profile, error: profileError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/profiles?userID=${sourceRecipe[0].userID}`, { headers: { authorization } });
        if (profileError) {
          throw errorGen(
            sourceRecipeError.message || `Error getting profile for userID: ${sourceRecipe[0].userID}: ${profileError.message}`,
            sourceRecipeError.code || 520,
            sourceRecipeError.name || 'unhandledError_recipes-getRecipeSubscriptions',
            sourceRecipeError.isOperational || false,
            sourceRecipeError.severity || 2,
          );
        }

        enhancedSubscriptions.push({
          subscriptionID: subscriptions[i].subscriptionID,
          sourceRecipeID: subscriptions[i].sourceRecipeID,
          newRecipeID: subscriptions[i].newRecipeID,
          startDate: subscriptions[i].startDate,
          authorID: sourceRecipe[0].userID,
          authorName: `${profile.nameFirst} ${profile.nameLast}`,
          authorUsername: profile.username,
          authorPhotoURL: profile.imageURL,
        });
      }
      global.logger.info({ message: `Got ${subscriptions.length} recipeSubscriptions for userID: ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return enhancedSubscriptions;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getRecipeSubscriptions', err.code || 520, err.name || 'unhandledError_recipes-getRecipeSubscriptions', err.isOperational || false, err.severity || 2);
    }
  }

  async function getRecipeSubscriptionsByRecipeID(options) {
    const { recipeID } = options;

    try {
      const { data: subscriptions, error } = await db.from('recipeSubscriptions').select('subscriptionID, sourceRecipeID, newRecipeID, startDate').eq('sourceRecipeID', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipeSubscriptions for recipeID: ${recipeID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: ``, level: 6, timestamp: new Date().toISOString(), userID: subscriptions[0].userID || 0 });
      return subscriptions;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes getRecipeSubscriptionsByRecipeID', err.code || 520, err.name || 'unhandledError_recipes-getRecipeSubscriptionsByRecipeID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = options;

    try {
      const status = 'noIngredients';

      if (!title) {
        throw errorGen(`Title is required to create recipe`, 510, 'dataValidationErr', false, 3);
      }
      if (!servings || servings < 0) {
        throw errorGen(`positive Servings integer is required to create recipe`, 510, 'dataValidationErr', false, 3);
      }
      if (!lifespanDays || lifespanDays < 0) {
        throw errorGen(`positive LifespanDays integer is required to create recipe`, 510, 'dataValidationErr', false, 3);
      }
      if (!timePrep || timePrep < 0) {
        throw errorGen(`positive TimePrep integer is required`, 510, 'dataValidationErr', false, 3);
      }
      if (timeBake && timeBake < 1) {
        throw errorGen(`positive TimeBake integer is required`, 510, 'dataValidationErr', false, 3);
      }

      //verify that the provided recipeCategoryID exists, return error if not
      if (recipeCategoryID) {
        const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
        if (error) {
          throw errorGen(`Error getting recipeCategory: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        if (!recipeCategory.length) {
          throw errorGen(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist, cannot create recipe`, 515, 'cannotComplete', false, 3);
        }
      }

      //create recipe
      const { data: recipe, error } = await db.from('recipes').insert({ recipeID: customID, userID, title, servings, lifespanDays, recipeCategoryID, status, timePrep, timeBake, photoURL, version: 1, type }).select().single();

      if (error) {
        throw errorGen(`Error inserting recipe into db: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      createRecipeLog(userID, authorization, 'createRecipe', recipe.recipeID, null, null, null, `Created Recipe: ${recipe.title}`);

      global.logger.info({ message: `Created recipe ID:${recipe.recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // return recipe;
      return {
        recipeID: recipe.recipeID,
        title: recipe.title,
        servings: recipe.servings,
        lifespanDays: recipe.lifespanDays,
        recipeCategoryID: recipe.recipeCategoryID,
        status: recipe.status,
        timePrep: recipe.timePrep,
        timeBake: recipe.timeBake,
        photoURL: recipe.photoURL,
        type: recipe.type,
        version: 1,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes create', err.code || 520, err.name || 'unhandledError_recipes-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID) {
    try {
      // validate resulting json, return if it lacks minimum requirements
      if (recipeJSON.error) {
        if (recipeJSON.error === 10) {
          throw errorGen(`The provided image does not show enough recipe details or is not clear enough to be analyzed. Please try again with a different image`, 515, 'cannotComplete', false, 4);
        }
        throw errorGen(`Could not analyze the provided image: ${recipeJSON.error}. Please try again later`, 515, 'cannotComplete', false, 3);
      }
      if (!recipeJSON.title) {
        throw errorGen(`No recipe title found in image. Can't create recipe.`, 515, 'cannotComplete', false, 3);
      }
      // save recipeJSON to file
      // const sanitizedTitle = recipeJSON.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // const recipeJSONPath = path.join(__dirname, `../../data/recipes/${sanitizedTitle}.json`);
      // if (!fs.existsSync(path.dirname(recipeJSONPath))) {
      //   fs.mkdirSync(path.dirname(recipeJSONPath), { recursive: true });
      // }
      // fs.writeFileSync(recipeJSONPath, JSON.stringify(recipeJSON));
      global.logger.info({ message: `'processRecipeJSON' JSON: ${JSON.stringify(recipeJSON)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

      if (!recipeJSON.category) {
        throw errorGen(`No recipe category found in image. Can't create recipe.`, 515, 'cannotComplete', false, 3);
      }

      sendSSEMessage(userID, { message: `General Recipe details look good, checking ingredient details...` });
      // validate recipe settings
      recipeJSON.servings = Math.floor(recipeJSON.servings) || 1;

      // validate returned ingredients
      if (recipeJSON.ingredients.length < 1) {
        throw errorGen(`No ingredients found in image. Can't create recipe.`, 515, 'cannotComplete', false, 3);
      }
      const units = process.env.MEASUREMENT_UNITS.split(',');

      const indexesToRemove = new Set();
      for (let i = 0; i < recipeJSON.ingredients.length; i++) {
        if (!recipeJSON.ingredients[i].name) {
          global.logger.info({ message: `ingredient missing name. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          indexesToRemove.add(i);
        }
        if (!recipeJSON.ingredients[i].measurement || recipeJSON.ingredients[i].measurement <= 0) {
          global.logger.info({ message: `missing or invalid ingredient measurement. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          indexesToRemove.add(i);
        }
        if (!recipeJSON.ingredients[i].measurementUnit) {
          global.logger.info({ message: `missing ingredient measurementUnit. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          indexesToRemove.add(i);
        }
        // convert units to singular
        recipeJSON.ingredients[i] = singularUnit(recipeJSON.ingredients[i]);

        // remove 'preparation' from object if it is null
        if (!recipeJSON.ingredients[i].preparation) {
          delete recipeJSON.ingredients[i].preparation;
        }

        // remove 'component' from object if it is null
        if (!recipeJSON.ingredients[i].component) {
          delete recipeJSON.ingredients[i].component;
        }

        if (!units.includes(recipeJSON.ingredients[i].measurementUnit)) {
          if (recipeJSON.ingredients[i].measurementUnit === 'ounce') {
            recipeJSON.ingredients[i].measurementUnit = 'weightOunce';
          } else {
            global.logger.info({ message: `invalid ingredient measurementUnit. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
            indexesToRemove.add(i);
          }
          continue;
        }
      }
      // remove invalid ingredients from array
      for (let i of Array.from(indexesToRemove).sort((a, b) => b - a)) {
        recipeJSON.ingredients.splice(i, 1);
      }

      sendSSEMessage(userID, { message: `Checking tool details...` });
      //validate returned tools
      if (!recipeJSON.tools || recipeJSON.tools.length < 1) {
        recipeJSON['tools'] = [{ quantity: -1 }];
      } else {
        for (let i = 0; i < recipeJSON.tools.length; i++) {
          if (!recipeJSON.tools[i].name) {
            throw errorGen(`tool missing name, cannot create recipe`, 515, 'cannotComplete', false, 3);
          }
          if (recipeJSON.tools[i].quantity < 0) {
            throw errorGen(`invalid tool quantity, cannot create recipe`, 515, 'cannotComplete', false, 3);
          }
          if (!recipeJSON.tools[i].quantity) {
            recipeJSON.tools[i]['quantity'] = 1;
          }
        }
      }

      //validate return steps
      sendSSEMessage(userID, { message: `Checking step details...` });
      if (recipeJSON.steps.length < 1) {
        throw errorGen(`no recipe steps found in image, cannot create recipe`, 515, 'cannotComplete', false, 3);
      }

      const toolIndexesToRemove = new Set();
      recipeJSON.steps = addStepSequences(recipeJSON.steps);
      for (let i = 0; i < recipeJSON.steps.length; i++) {
        if (!recipeJSON.steps[i].title) {
          global.logger.info({ message: `step missing title. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          toolIndexesToRemove.add(i);
        }
        if (!recipeJSON.steps[i].description) {
          global.logger.info({ message: `step missing description. Removing from draft recipe. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          toolIndexesToRemove.add(i);
        }
        recipeJSON.steps[i].stepID = 0;
      }
      // remove invalid steps from array
      for (let i of Array.from(toolIndexesToRemove).sort((a, b) => b - a)) {
        recipeJSON.steps.splice(i, 1);
      }

      // get user ingredients from supabase
      const { data: userIngredients, error: userIngredientsError } = await db.from('ingredients').select('name, purchaseUnit, ingredientID, gramRatio').eq('userID', userID).eq('deleted', false);
      if (userIngredientsError) {
        throw errorGen(`Error getting userIngredients to map in recipe creation: ${userIngredientsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // match ingredients with user Ingredients
      sendSSEMessage(userID, { message: `Mapping Recipe Ingredients with your Kitchen Ingredients..` });
      let matchedIngredientsResponse = await matchIngredients(recipeJSON.ingredients, authorization, userID, userIngredients);
      let matchedIngredients = matchedIngredientsResponse.matchedTwiceIngredients;

      // **************** ADD UNIT RATIOS TO MATCHED INGREDIENTS ***************
      let unitRatioCost = 0;
      // add purchaseUnitRatios to ingredients in parrallel
      const ingredientPurchaseUnitRatioPromises = [];
      global.logger.info({ message: `ADDING PURCHASEUNITRATIOS TO MATCHED INGREDIENTS`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      for (let i = 0; i < matchedIngredients.length; i++) {
        if (matchedIngredients[i].purchaseUnitRatio) {
          matchedIngredients[i].RIneedsReview = false;
          continue;
        }
        if (matchedIngredients[i].purchaseUnit === matchedIngredients[i].measurementUnit) {
          matchedIngredients[i].purchaseUnitRatio = 1;
          matchedIngredients[i].RIneedsReview = false;
        } else {
          const purchaseUnitRatioPromise = getUnitRatio(matchedIngredients[i].name, matchedIngredients[i].purchaseUnit, matchedIngredients[i].measurementUnit, authorization, userID);
          ingredientPurchaseUnitRatioPromises.push(
            purchaseUnitRatioPromise.then((result) => {
              if (result.cost) {
                unitRatioCost += result.cost;
              }
              global.logger.info({ message: `GOT RESULT FROM AI PUR ESTIMATE: ${JSON.stringify(result)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
              matchedIngredients[i].purchaseUnitRatio = result.ratio;
              matchedIngredients[i].RIneedsReview = result.needsReview;
            }),
          );
        }
      }
      await Promise.allSettled(ingredientPurchaseUnitRatioPromises);
      // remove any ingredients that failed to get purchaseUnitRatio
      matchedIngredients = matchedIngredients.filter((i) => {
        if (i.purchaseUnitRatio && typeof i.purchaseUnitRatio === 'number' && i.purchaseUnitRatio > 0) return true;
        else {
          global.logger.info({ message: `Invalid purchaseUnitRatio for ingredient ${i.name}: ${i.purchaseUnitRatio}, removing from recipe.`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          return false;
        }
      });
      global.logger.info({ message: `DONE ADDING PURCHASEUNITRATIOS TO MATCHED INGREDIENTS, MATCHED INGREDIENTS: ${JSON.stringify(matchedIngredients)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      // if ingredientID is 0, also need to get gramRatio
      const ingredientGramRatioPromises = [];
      for (let i = 0; i < matchedIngredients.length; i++) {
        if (matchedIngredients[i].ingredientID === 0) {
          global.logger.info({ message: `ADDING GRAMRATIO TO NEW INGREDIENT: ${JSON.stringify(matchedIngredients[i])}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          const gramRatioPromise = getUnitRatio(matchedIngredients[i].name, 'gram', matchedIngredients[i].purchaseUnit, authorization, userID);
          ingredientGramRatioPromises.push(
            gramRatioPromise.then((result) => {
              if (result.cost) {
                unitRatioCost += result.cost;
              }
              matchedIngredients[i].gramRatio = result.ratio;
            }),
          );
        }
      }
      await Promise.allSettled(ingredientGramRatioPromises);
      global.logger.info({ message: `'processRecipeJSON' PRE FILTER: ${JSON.stringify(matchedIngredients)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      // remove any ingredients that have ingredientID of 0 and a gramRatio that is missing or less than 1
      matchedIngredients = matchedIngredients.filter((i) => {
        if (i.ingredientID !== 0) {
          return true;
        }
        if (!i.gramRatio || i.gramRatio <= 0 || typeof i.gramRatio !== 'number') {
          global.logger.info({ message: `Invalid gramRatio for ingredient ${i.name}: ${i.gramRatio}, removing from recipe.`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          return false;
        }
        return true;
      });

      global.logger.info({ message: `DONE ADDING GRAMRATIO TO MATCHED INGREDIENTS. MATCHED INGREDIENTS: ${JSON.stringify(matchedIngredients)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // ***************************************************************************

      // match tools with user tools
      sendSSEMessage(userID, { message: `Mapping Recipe Tools with your Kitchen Tools..` });
      const matchedTools = await matchTools(recipeJSON.tools, authorization, userID);

      // match category
      sendSSEMessage(userID, { message: `Finding Appropriate Category for Recipe` });
      const matchedCategoryID = await matchCategory(recipeJSON.category, authorization, userID);

      // prepare constructRecipe body
      const constructBody = {
        title: recipeJSON.title,
        servings: recipeJSON.servings || 1,
        lifespanDays: recipeJSON.lifespanDays || 1,
        timePrep: recipeJSON.timePrep || 1,
        type: 'private',
        sourceRecipeID: 0,
        recipeCategoryID: matchedCategoryID,
        ingredients: matchedIngredients,
        tools: matchedTools,
        steps: recipeJSON.steps,
        ...(recipeJSON.timeBake && { timeBake: recipeJSON.timeBake }), //include 'timeBake' if not null
      };
      global.logger.info({ message: `CALLING CONSTRUCT WITH BODY: ${JSON.stringify(constructBody)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      if (recipePhotoURL) {
        constructBody['photoURL'] = recipePhotoURL;
      }
      global.logger.info({ message: `CONSTRUCT BODY: ${JSON.stringify(constructBody)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

      // call constructRecipe with body
      sendSSEMessage(userID, { message: `Details ready! Building new Recipe...` });
      const { data: recipeID, error: constructError } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/constructed`, constructBody, { headers: { authorization } });
      if (constructError) {
        throw errorGen(constructError.message || `Error constructing recipe from image details: ${constructError.message}`, constructError.code || 520, constructError.name || 'unhandledError_recipes-processRecipeJSON', constructError.isOperational || false, constructError.severity || 3);
      }
      // const recipeID = recipe.recipeID;

      // fix the vertexaiCost to 4 decimals
      const vertexaiCost = parseFloat(matchedIngredientsResponse.vertexaiCost).toFixed(4);
      // global.logger.info(`vertexAI Cost (all ingr) to find match and get PU/LD: ${vertexaiCost}`);
      global.logger.info({ message: `vertexAI Cost (all ingr) to find match and get PU/LD: ${vertexaiCost}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      const vertexaiUnitConversionCost = parseFloat(unitRatioCost).toFixed(4);
      global.logger.info({ message: `vertexAI Cost (all unit conversion): ${vertexaiUnitConversionCost}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      sendSSEMessage(userID, { message: `done` });
      return recipeID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes processRecipeJSON', err.code || 520, err.name || 'unhandledError_recipes-processRecipeJSON', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  function addStepSequences(steps) {
    let sequence = 1;
    for (let i = 0; i < steps.length; i++) {
      steps[i].sequence = sequence;
      sequence++;
    }
    return steps;
  }

  async function createVision(options) {
    const { userID, recipeSourceImageURL, recipePhotoURL, authorization } = options;

    try {
      // call openaiHandler to build recipe json
      let elapsedTime = 0;
      const timer = setInterval(() => {
        elapsedTime += 1;
        sendSSEMessage(userID, { message: `Getting recipe details from image. Expected Time: 25 seconds. Elapsed: ${elapsedTime}` });
      }, 1000); // Send progress update every second
      global.logger.info({ message: `Calling visionRequest`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      const visionStartTime = new Date();
      const { response, error } = await visionRequest(recipeSourceImageURL, userID, authorization, 'generateRecipeFromImage');
      clearInterval(timer);
      if (error) {
        throw errorGen(error.message || `Error creating recipe from source image: ${error.message}`, error.code || 520, error.name || 'unhandledError_recipes-processRecipeJSON', error.isOperational || false, error.severity || 3);
      }
      const recipeJSON = JSON.parse(response);
      // Stop timer and calculate duration
      const visionEndTime = new Date();
      const visionDuration = visionEndTime - visionStartTime; // duration in milliseconds
      global.logger.info({ message: `*TIME* recipe visionRequest: ${visionDuration / 1000} seconds`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      const recipeID = await processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID);

      const endTime = new Date();
      const totalDuration = endTime - visionStartTime;
      global.logger.info({ message: `*TIME* vison recipe and construct total: ${totalDuration / 1000} seconds`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      return recipeID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes processRecipeJSON', err.code || 520, err.name || 'unhandledError_recipes-processRecipeJSON', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function createFromURL(options) {
    const { userID, recipeURL, recipePhotoURL, authorization } = options;

    try {
      // max attempts to create recipe from URL
      const maxAttempts = 3;

      // attempt to create recipe from URL
      let recipeID;
      let attempt = 1;
      while (attempt <= maxAttempts) {
        try {
          global.logger.info({ message: `Attempt ${attempt} to create recipe from URL: ${recipeURL}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          recipeID = await createFromURLAttempt(userID, authorization, recipeURL, recipePhotoURL);
          break;
        } catch (error) {
          global.logger.info({ message: `Error creating recipe from URL: ${error.message}`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          if (attempt === maxAttempts) {
            throw errorGen(`Reached Max retries for creating recipe from URL: ${error.message}`, 500);
          }
          attempt++;
        }
      }
      global.logger.info({ message: `Created recipe from URL: ${recipeURL}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipeID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes createFromURL', err.code || 520, err.name || 'unhandledError_recipes-createFromURL', err.isOperational || false, err.severity || 2);
    }
  }

  async function createFromURLAttempt(userID, authorization, recipeURL, recipePhotoURL) {
    try {
      global.logger.info({ message: `Creating recipe from URL: ${recipeURL}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // call 'getHtml' to get recipe details from URL
      sendSSEMessage(userID, { message: `Opening provided web page...` });
      const { html, error } = await getHtml(recipeURL, userID, authorization, 'generateRecipeFromURL');
      if (error) {
        throw errorGen(error.message || `Error getting Source Recipe details. Can't create recipe: ${error.message}`, error.code || 520, error.name || 'unhandledError_recipes-createFromURL', error.isOperational || false, error.severity || 2);
      }

      const htmlText = await extractFromHtml(html);
      if (!htmlText) {
        throw errorGen(`Error extracting recipe details from URL: ${recipeURL}, cannot create recipe`, 515, 'cannotComplete', false, 2);
      }
      global.logger.info({ message: `HTML TEXT: ${htmlText}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

      // call openaiHandler to build recipe json
      let elapsedTime = 0;
      const timer = setInterval(() => {
        elapsedTime += 1;
        sendSSEMessage(userID, { message: `Getting recipe details from web page. Expected Time: 25 seconds. Elapsed: ${elapsedTime}` });
      }, 1000); // Send progress update every second
      const visionStartTime = new Date();
      const result = await recipeFromTextRequest(htmlText, userID, authorization);
      clearInterval(timer);

      const recipeJSON = JSON.parse(result.response);

      const recipeID = await processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID);

      const endTime = new Date();
      const totalDuration = endTime - visionStartTime;
      global.logger.info({ message: `*TIME* URL recipe and construct total: ${totalDuration / 1000} seconds`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      return recipeID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes createFromURLAttempt', err.code || 520, err.name || 'unhandledError_recipes-createFromURLAttempt', err.isOperational || false, err.severity || 2);
    }
  }

  async function matchIngredients(ingredients, authorization, userID, userIngredients) {
    try {
      const userIngredientsInfo = userIngredients.map((i) => {
        return { name: i.name, ingredientID: i.ingredientID, purchaseUnit: i.purchaseUnit, needsReview: true };
      });
      const matchedIngredients = [];

      // First, search for exact name match
      for (let i = 0; i < ingredients.length; i++) {
        const primaryMatchResult = await matchIngredientByName(userID, authorization, ingredients[i], userIngredientsInfo);
        matchedIngredients.push(primaryMatchResult);
      }
      global.logger.info({ message: `MATCHED INGREDIENTS AFTER PRIMARY METHOD: ${JSON.stringify(matchedIngredients)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });

      const matchedTwiceIngredients = [];
      // Fallback to try using AI to find matches
      const promises = [];
      const userIngredientNames = userIngredients.map((i) => i.name);
      for (let i = 0; i < matchedIngredients.length; i++) {
        // if the matchedIngredient has an ingredientID of 0, we need to try asking AI to match it with an existing userIngredient. Make a promise of each call to the 'matchRecipeItemRequest' function and add to promises array. If the ingredientID is not 0, we already found a match and can skip this item.
        if (matchedIngredients[i].ingredientID === 0) {
          global.logger.info({ message: `MATCHED INGREDIENT ${matchedIngredients[i].name} HAS INGREDIENTID 0, ATTEMPTING TO MATCH WITH AI`, level: 7, timestamp: new Date().toISOString(), userID: userID });
          promises.push(
            matchRecipeIngredientRequest(userID, authorization, matchedIngredients[i].name, userIngredientNames)
              .then((data) => {
                const ingredientJSON = data.response;
                if (ingredientJSON.error) {
                  global.logger.info({ message: `Error matching ingredient with AI: ${ingredientJSON.error}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
                  return { ...matchedIngredients[i], invalid: true, cost: data.cost };
                }
                global.logger.info({ message: `AI MATCHED INGREDIENT: ${JSON.stringify(ingredientJSON)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
                if (ingredientJSON.foundMatch) {
                  const ingredientID = userIngredients.find((i) => i.name === ingredientJSON.ingredientName);
                  if (!ingredientID) {
                    global.logger.info({ message: `Error matching ingredient with AI: ${ingredientJSON.error}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
                    return { ...matchedIngredients[i], invalid: true, cost: data.cost };
                  }
                  return {
                    ...matchedIngredients[i],
                    ingredientID: Number(ingredientID.ingredientID),
                    purchaseUnit: ingredientJSON.purchaseUnit,
                    cost: data.cost,
                    needsReview: false,
                  };
                } else {
                  const validUnits = process.env.MEASUREMENT_UNITS.split(',');
                  if (!ingredientJSON.lifespanDays || ingredientJSON.lifespanDays <= 0) {
                    global.logger.info({ message: `AI provided Invalid lifespanDays for ingredient ${matchedIngredients[i].name}: ${ingredientJSON.lifespanDays}, removing from recipe.`, level: 4, timestamp: new Date().toISOString(), userID: userID });
                    return { ...matchedIngredients[i], invalid: true, cost: data.cost };
                  }
                  if (!validUnits.includes(ingredientJSON.purchaseUnit)) {
                    global.logger.info({ message: `AI provided Invalid purchaseUnit for ingredient ${matchedIngredients[i].name}: ${ingredientJSON.lifespanDays}, removing from recipe.`, level: 4, timestamp: new Date().toISOString(), userID: userID });
                    return { ...matchedIngredients[i], invalid: true, cost: data.cost };
                  }
                  return {
                    ...matchedIngredients[i],
                    ingredientID: 0,
                    lifespanDays: ingredientJSON.lifespanDays,
                    purchaseUnit: ingredientJSON.purchaseUnit,
                    needsReview: true,
                    cost: data.cost,
                  };
                }
                // add character count to vertexaiCharacters
              })
              .catch((error) => {
                global.logger.info({ message: `Error matching ingredient with AI: ${error.message}`, level: 3, timestamp: new Date().toISOString(), userID: userID });
                return { ...matchedIngredients[i], invalid: true };
              }),
          );
        } else {
          // stuff that was already matched via exact name match
          matchedTwiceIngredients.push(matchedIngredients[i]);
        }
      }

      const results = await Promise.allSettled(promises);
      // calculate vertexaiCost
      let vertexaiCost = 0;
      // Filter successful and valid responses and add to matchedTwiceIngredients
      for (let i = 0; i < results.length; i++) {
        vertexaiCost += results[i].value?.cost || 0;
        if (results[i].status === 'fulfilled' && results[i].invalid) {
          global.logger.info({ message: `Invalid ingredient, not adding to recipe: ${JSON.stringify(results[i])}`, level: 4, timestamp: new Date().toISOString(), userID: userID });
          //don't add invalid ingredients to the matchedTwiceIngredients array
        }
        if (results[i].status === 'fulfilled' && results[i].value && !results[i].value.invalid) {
          global.logger.info({ message: `PUSHING AI MATCHED INGREDIENT TO MATCHEDTWICEINGREDIENTS: ${JSON.stringify(results[i].value)}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          matchedTwiceIngredients.push(results[i].value);
        }
      }

      return { matchedTwiceIngredients, vertexaiCost };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes matchIngredients', err.code || 520, err.name || 'unhandledError_recipes-matchIngredients', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function matchIngredientByName(userID, authorization, recipeIngredient, userIngredientNames) {
    try {
      // search for exact name match (case-insensitive) among existing user ingredients for provided recipe ingredient. If one is found, return resulting recipeIngredient with ingredientID and retrieved purchasedUnitRatio, also including the 'needsReview' value provided by getPurchaseUnitRatio. If no match is found, return recipeIngredient with ingredientID of 0.
      global.logger.info({ message: `IN PRIMARY INGREDIENT NAME MATCH. RI: ${JSON.stringify(recipeIngredient)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

      const userIngredientMatch = userIngredientNames.find((i) => i.name.toLowerCase() === recipeIngredient.name.toLowerCase());

      if (userIngredientMatch) {
        global.logger.info({ message: `FOUND MATCH FOR ${recipeIngredient.name} in ${JSON.stringify(userIngredientMatch)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

        global.logger.info({ message: `GETTING PUR FOR ${recipeIngredient.name} ${recipeIngredient.measurementUnit} and ${userIngredientMatch.purchaseUnit}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        let purchaseUnitRatio;
        let needsReview;
        if (!userIngredientMatch.measurementUnit === userIngredientMatch.purchaseUnit) {
          purchaseUnitRatio = 1;
          needsReview = false;
        } else {
          const data = await getUnitRatio(recipeIngredient.name, userIngredientMatch.purchaseUnit, recipeIngredient.measurementUnit, authorization, userID);
          purchaseUnitRatio = data.unitRatio;
          needsReview = data.needsReview;
        }
        global.logger.info({ message: `PUR RESULT: ${purchaseUnitRatio}`, level: 7, timestamp: new Date().toISOString(), userID: userID });

        const result = {
          name: recipeIngredient.name,
          measurement: recipeIngredient.measurement,
          measurementUnit: recipeIngredient.measurementUnit,
          purchaseUnit: userIngredientMatch.purchaseUnit,
          ingredientID: Number(userIngredientMatch.ingredientID),
          purchaseUnitRatio,
          needsReview,
        };

        if (recipeIngredient.preparation) {
          result.preparation = recipeIngredient.preparation;
        }
        if (recipeIngredient.component) {
          result.component = recipeIngredient.component;
        }

        return result;
      }

      global.logger.info({ message: `NO MATCH FOUND FOR ${recipeIngredient.name}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      return {
        name: recipeIngredient.name,
        measurement: recipeIngredient.measurement,
        measurementUnit: recipeIngredient.measurementUnit,
        ingredientID: 0,
        lifespanDays: recipeIngredient.lifespanDays,
        purchaseUnit: recipeIngredient.purchaseUnit,
        gramRatio: recipeIngredient.gramRatio,
        purchaseUnitRatio: recipeIngredient.purchaseUnitRatio,
        preparation: recipeIngredient.preparation,
        component: recipeIngredient.component,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes matchIngredientByName', err.code || 520, err.name || 'unhandledError_recipes-matchIngredientByName', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function matchTools(tools, authorization, userID) {
    try {
      // get user tools from supabase
      const { data: userTools, error: userToolsError } = await db.from('tools').select('name, toolID').eq('userID', userID).eq('deleted', false);
      if (userToolsError) {
        throw errorGen(`Error getting userTools: ${userToolsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const matchedTools = [];

      // First, try using AI to find matches
      const promises = tools.map((tool) => {
        if (tool.quantity === -1) {
          // Return a resolved promise for dummy tools
          return Promise.resolve({ quantity: -1 });
        }
        return matchRecipeItemRequest(userID, authorization, 'findMatchingTool', tool.name, userTools)
          .then((data) => {
            const toolJSON = JSON.parse(data.response);
            return toolJSON.toolID ? { toolID: Number(toolJSON.toolID), name: tool.name, quantity: tool.quantity } : { toolID: 0, quantity: tool.quantity, name: tool.name };
          })
          .catch((error) => {
            global.logger.info({ message: `Error matching tool: ${error.message}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
            return null;
          });
      });
      const results = await Promise.allSettled(promises);

      // Filter successful responses and add to matchedTools
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled' && results[i].value) {
          if (results[i].value.toolID !== 0) {
            matchedTools.push(results[i].value);
          } else {
            // fallback match attempt looking for exact string match on name
            const secondaryMatchResult = await secondaryToolsMatch(results[i].value, userTools);
            matchedTools.push(secondaryMatchResult);
          }
        }
      }

      return matchedTools;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes matchTools', err.code || 520, err.name || 'unhandledError_recipes-matchTools', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function secondaryToolsMatch(recipeTool, userTools) {
    try {
      global.logger.info({ message: `IN SECONDARY TOOLS MATCH. RT: ${JSON.stringify(recipeTool)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      const userToolMatch = userTools.find((t) => t.name.toLowerCase() === recipeTool.name.toLowerCase());
      if (userToolMatch) {
        global.logger.info({ message: `FOUND MATCH FOR ${recipeTool.name} in ${JSON.stringify(userToolMatch)}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
        return { toolID: Number(userToolMatch.toolID), name: recipeTool.name, quantity: recipeTool.quantity };
      }
      global.logger.info({ message: `NO MATCH FOUND FOR ${recipeTool.name}`, level: 7, timestamp: new Date().toISOString(), userID: userID });
      return { toolID: 0, name: recipeTool.name, quantity: recipeTool.quantity };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes secondaryToolsMatch', err.code || 520, err.name || 'unhandledError_recipes-secondaryToolsMatch', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function matchCategory(recipeCategory, authorization, userID) {
    try {
      // get categories from supabase
      const { data: categories, error: categoriesError } = await db.from('recipeCategories').select('recipeCategoryID, name');
      if (categoriesError) {
        throw errorGen(`Error getting categories: ${categoriesError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const { response, error } = await matchRecipeItemRequest(userID, authorization, 'findMatchingCategory', recipeCategory, categories);
      if (error) {
        throw errorGen(error.message || `Error matching category: ${error.message}`, error.code || 520, error.name || 'unhandledError_recipes-matchCategory', error.isOperational || false, error.severity || 2);
      }
      const categoryJSON = JSON.parse(response);

      if (categoryJSON.recipeCategoryID) {
        return categoryJSON.recipeCategoryID;
      } else {
        // return recipeCategoryID for 'Other'
        return 2023112900000005;
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes matchCategory', err.code || 520, err.name || 'unhandledError_recipes-matchCategory', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function update(options) {
    const { recipeID, authorization, recipeCategoryID, timePrep, timeBake } = options;

    try {
      //verify that the provided recipeID exists, return error if not
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);

      if (error) {
        throw errorGen(`Error getting recipe: ${error.message} during update attempt`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`Recipe with provided ID (${recipeID}) does not exist, cannot update`, 515, 'cannotComplete', false, 3);
      }

      //verify that the provided recipeCategoryID exists, return error if not
      if (recipeCategoryID) {
        const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
        if (error) {
          throw errorGen(`Error getting recipeCategory: ${error.message} during recipe update attempt`, 511, 'failSupabaseSelect', true, 3);
        }
        if (!recipeCategory.length) {
          throw errorGen(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist, cannot update recipe`, 515, 'cannotComplete', false, 3);
        }
      }

      //verify that servings, lifespanDays, timePrep, and timeBake are positive integers, if provided. Return error if not
      if (options.servings && options.servings < 1) {
        throw errorGen(`Servings should be positive integer`, 510, 'dataValidationErr', false, 3);
      }
      if (options.lifespanDays && options.lifespanDays < 1) {
        throw errorGen(`LifespanDays should be positive integer`, 510, 'dataValidationErr', false, 3);
      }
      if (timePrep && timePrep < 1) {
        throw errorGen(`TimePrep should be positive integer`, 510, 'dataValidationErr', false, 3);
      }
      if (timeBake && timeBake < 1) {
        throw errorGen(`TimeBake should be positive integer`, 510, 'dataValidationErr', false, 3);
      }

      const updateFields = {};
      if (options.status) {
        //ensure provided status is valid value
        if (options.status !== 'noIngredients' && options.status !== 'noTools' && options.status !== 'noSteps' && options.status !== 'published') {
          throw errorGen(`Invalid status provided, can't update recipe`, 510, 'dataValidationErr', false, 3);
        }
      }
      for (let key in options) {
        if (key !== 'recipeID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }
      const updatedRecipe = await updater(options.userID, authorization, 'recipeID', recipeID, 'recipes', updateFields);
      // if type was updated to 'public', call 'addFolloweePublicRecipeCreatedMessages'
      if (updateFields.type === 'public') {
        axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/messages`,
          {
            userID: options.userID,
            message: {
              type: 'addFolloweePublicRecipeCreatedMessages',
              recipeID: options.recipeID,
              recipeTitle: recipe[0].title,
            },
          },
          { headers: { authorization } },
        );
      }

      // if type was updated to 'heirloom', call 'addFriendHeirloomRecipeCreatedMessages'
      if (updateFields.type === 'heirloom') {
        // messageProcessor.addFriendHeirloomRecipeCreatedMessages({ userID: options.userID, recipeID: options.recipeID, recipeTitle: recipe.title });
        axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/messages`,
          {
            userID: options.userID,
            message: {
              type: 'addFriendHeirloomRecipeCreatedMessages',
              recipeID: options.recipeID,
              recipeTitle: recipe[0].title,
            },
          },
          { headers: { authorization } },
        );
      }
      return updatedRecipe;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes update', err.code || 520, err.name || 'unhandledError_recipes-update', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteRecipe(options) {
    try {
      //verify that the provided recipeID exists, return error if not
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipe: ${error.message} during delete attempt`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`Recipe with provided ID (${options.recipeID}) does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      }

      //if recipe has photoURL, delete photo from s3
      if (recipe[0].photoURL) {
        const url = `${process.env.NODE_HOST}:${process.env.PORT}/uploads/image?userID=${encodeURIComponent(options.userID)}&photoURL=${encodeURIComponent(recipe[0].photoURL)}&type=recipe&id=${options.recipeID}`;
        await axios.delete(url, { headers: { authorization: options.authorization } });
        global.logger.info({ message: `Deleted photo for recipeID ${options.recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: options.userID });
      }

      // attempt to delete the recipe and all component data
      const { data, error2 } = await dbPublic.rpc('recipe_delete', { recipe: Number(options.recipeID) });
      if (error2) {
        throw errorGen(`Error deleting recipe: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      if (data === 'NONE') {
        throw errorGen(`Recipe with provided ID (${options.recipeID}) does not exist, cannot delete`, 515, 'cannotComplete', false, 2);
      } else if (!data) {
        throw errorGen(`Error deleting recipe: ${error2.message}`, 514, 'failSupabaseDelete', true, 3);
      }

      //add a 'deleted' log entry
      createRecipeLog(options.userID, options.authorization, 'deleteRecipe', Number(options.recipeID), null, null, null, `deleted recipe: ${recipe[0].title}, ID: ${options.recipeID}`);
      global.logger.info({ message: `Deleted recipe ID: ${options.recipeID}`, level: 6, timestamp: new Date().toISOString(), userID: options.userID });
      return { success: true };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes deleteRecipe', err.code || 520, err.name || 'unhandledError_recipes-deleteRecipe', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function useRecipe(options) {
    const { recipeID, authorization, satisfaction, difficulty, note, checkIngredientStock } = options;

    try {
      //ensure provided satisfaction is valid number one through ten
      if (!satisfaction || satisfaction < 1 || satisfaction > 10) {
        throw errorGen(`Satisfaction should be integer between 1 and 10`, 510, 'dataValidationErr', false, 3);
      }

      //ensure provided difficulty is valid number one through ten
      if (!difficulty || difficulty < 1 || difficulty > 10) {
        throw errorGen(`Difficulty should be integer between 1 and 10`, 510, 'dataValidationErr', false, 3);
      }

      //ensure provided recipeID exists
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting recipe details: ${error.message} during use attempt`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`Recipe with provided ID ${recipeID} does not exist, cannot use it`, 515, 'cannotComplete', false, 3);
      }

      if (checkIngredientStock) {
        //make call to supply service to check whether there is sufficient stock to make this recipe
        const { data: supplyCheckResult, error: supplyCheckError } = await supplyCheckRecipe(options.userID, authorization, recipeID);
        if (supplyCheckError) {
          throw errorGen(
            supplyCheckError.message || `Error checking supply for recipeID: ${recipeID} : ${supplyCheckError}, can't use recipe`,
            supplyCheckError.code || 520,
            supplyCheckError.name || 'unhandledError_recipes-deleteRecipe',
            supplyCheckError.isOperational || false,
            supplyCheckError.severity || 2,
          );
        }
        if (supplyCheckResult.status === 'insufficient') {
          throw errorGen(`Insufficient stock to make recipeID: ${recipeID}. Need ${JSON.stringify(supplyCheckResult.insufficientIngredients)} ingredients and ${JSON.stringify(supplyCheckResult.insufficientTools)} tools`, 515, 'cannotComplete', false, 3);
        }
      }

      if (checkIngredientStock) {
        //use stock of each recipeIngredient
        const useIngredientsResult = await useRecipeIngredients(options.userID, authorization, recipeID);
        if (useIngredientsResult.error) {
          throw errorGen(
            useIngredientsResult.message || `useRecipe' Error using recipeIngredients for recipeID: ${recipeID}. Rollback of inventory state was successful: ${useIngredientsResult.error.rollbackSuccess}`,
            useIngredientsResult.code || 520,
            useIngredientsResult.name || 'unhandledError_recipes-deleteRecipe',
            useIngredientsResult.isOperational || false,
            useIngredientsResult.severity || 2,
          );
        }
      }

      //log use of recipe
      const { log, createLogError } = await createRecipeFeedbackLog(options.userID, authorization, Number(recipeID), recipe[0].title, String(satisfaction), String(difficulty), note);
      if (createLogError) {
        throw errorGen(createLogError.message || `'useRecipe' Error logging recipe use: ${createLogError.message}`, createLogError.code || 520, createLogError.name || 'unhandledError_recipes-deleteRecipe', createLogError.isOperational || false, createLogError.severity || 2);
      }
      //return the log entry
      return log;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes useRecipe', err.code || 520, err.name || 'unhandledError_recipes-useRecipe', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function subscribeRecipe(options) {
    const { customID, sourceRecipeID, newRecipeID, userID } = options;

    try {
      //ensure provided sourceRecipeID exists and is not deleted
      const { data: sourceRecipe, error } = await db.from('recipes').select().eq('recipeID', sourceRecipeID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting sourceRecipe: ${error.message} during subscribe attempt`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!sourceRecipe.length) {
        throw errorGen(`Error subscribing to recipe. Recipe with provided ID (${sourceRecipeID}) does not exist, cannot subscribe to recipe`, 515, 'cannotComplete', false, 3);
      }
      if (sourceRecipe[0].userID === userID) {
        throw errorGen(`Error subscribing to recipe. Cannot subscribe to your own recipe`, 515, 'cannotComplete', false, 2);
      }

      //ensure provided newRecipeID exists and is not deleted
      const { data: newRecipe, error: newRecipeError } = await db.from('recipes').select().eq('recipeID', newRecipeID).eq('deleted', false);
      if (newRecipeError) {
        throw errorGen(`Error getting newRecipe: ${newRecipeError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!newRecipe.length) {
        throw errorGen(`Error subscribing to recipe. Recipe with provided ID (${newRecipeID}) does not exist`, 515, 'cannotComplete', false, 3);
      }

      //ensure provided sourceRecipeID is not the same as newRecipeID
      if (sourceRecipeID === newRecipeID) {
        throw errorGen(`Error subscribing to recipe. sourceRecipeID and newRecipeID cannot be the same`, 515, 'cannotComplete', false, 2);
      }

      //ensure provided sourceRecipeID is not already subscribed to newRecipeID
      const { data: existingSubscription, error: existingSubscriptionError } = await db.from('recipeSubscriptions').select('*').eq('sourceRecipeID', sourceRecipeID).eq('newRecipeID', newRecipeID);
      if (existingSubscriptionError) {
        throw errorGen(
          existingSubscriptionError.message || `Error getting existing subscription: ${existingSubscriptionError.message}`,
          existingSubscriptionError.code || 520,
          existingSubscriptionError.name || 'unhandledError_recipes-useRecipe',
          existingSubscriptionError.isOperational || false,
          existingSubscriptionError.severity || 2,
        );
      }
      const startDate = new Date();
      //if exists but deleted is true, undelete it and update startDate
      if (existingSubscription.length && existingSubscription[0].deleted) {
        const { data: updatedSubscription, error: undeleteError } = await db.from('recipeSubscriptions').update({ deleted: false, startDate }).eq('recipeSubscriptionID', existingSubscription[0].recipeSubscriptionID).single();
        if (undeleteError) {
          throw errorGen(`Error undeleting existing subscription: ${undeleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        return updatedSubscription.subscriptionID;
      } else if (existingSubscription.length) {
        throw errorGen(`Error subscribing to recipe. sourceRecipeID: ${sourceRecipeID} is already subscribed to newRecipeID: ${newRecipeID}`, 515, 'cannotComplete', false, 2);
      }

      //create subscription
      const { data: subscription, error: subscriptionError } = await db.from('recipeSubscriptions').insert({ userID, subscriptionID: customID, sourceRecipeID, newRecipeID, startDate }).select().single();
      if (subscriptionError) {
        throw errorGen(`Error creating subscription: ${subscriptionError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      return subscription.subscriptionID;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes subscribeRecipe', err.code || 520, err.name || 'unhandledError_recipes-subscribeRecipe', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function deleteRecipeSubscription(options) {
    const { subscriptionID, authorization, userID } = options;

    try {
      //ensure provided subscriptionID exists and is not deleted
      const { data: subscription, error } = await db.from('recipeSubscriptions').select().eq('subscriptionID', subscriptionID).eq('deleted', false);
      if (error) {
        throw errorGen(`Error getting subscription: ${error.message} when attempting subscription delete`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!subscription.length) {
        throw errorGen(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not exist`, 515, 'cannotComplete', false, 3);
      }
      if (subscription[0].userID !== userID) {
        throw errorGen(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not belong to user`, 515, 'cannotComplete', false, 3);
      }

      //delete subscription
      const { error: deleteError } = await db.from('recipeSubscriptions').update({ deleted: true }).eq('subscriptionID', subscriptionID);
      if (deleteError) {
        throw errorGen(`Error deleting subscription: ${deleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      //make axios call to delete recipe
      const { data: deleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${subscription[0].newRecipeID}`, { headers: { authorization } });
      if (deleteResult.error) {
        throw errorGen(`Error deleting recipe: ${deleteResult.error}`, 514, 'failSupabaseDelete', true, 3);
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes deleteRecipeSubscription', err.code || 520, err.name || 'unhandledError_recipes-deleteRecipeSubscription', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function archiveCreatedRecipes(options) {
    const { userID, recipeIDs } = options;

    try {
      // update all user recipes 'freeTier' property to false
      const { error } = await db.from('recipes').update({ freeTier: false }).neq('type', 'subscription').eq('userID', userID);
      if (error) {
        throw errorGen(`Error setting all recipes 'freeTier' to true during 'archiveCreatedRecipes': ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      // update 'freeTier' to true for any recipes in recipeIDs
      const { error: archiveError } = await db.from('recipes').update({ freeTier: true }).in('recipeID', recipeIDs).eq('userID', userID);
      if (archiveError) {
        throw errorGen(`Error archiving created recipes: ${archiveError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      global.logger.info({ message: `Updated 'freeTier' recipe selections: ${recipeIDs}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes archiveCreatedRecipes', err.code || 520, err.name || 'unhandledError_recipes-archiveCreatedRecipes', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function archiveSubscriptions(options) {
    const { userID, subscriptionIDs } = options;

    try {
      // update all user subscriptions 'freeTier' property to false
      const { error } = await db.from('recipes').update({ freeTier: false }).eq('type', 'subscription').eq('userID', userID);
      if (error) {
        throw errorGen(`Error setting all subscriptions 'freeTier' to true: ${error.message} during archiveSubscriptions`, 513, 'failSupabaseUpdate', true, 3);
      }

      // update 'freeTier' to true for any subscriptions in subscriptionIDs
      const { error: archiveError } = await db.from('recipes').update({ freeTier: true }).in('recipeID', subscriptionIDs).eq('userID', userID);
      if (archiveError) {
        throw errorGen(`Error archiving subscriptions: ${archiveError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      global.logger.info({ message: `Updated 'freeTier' subscription selections: ${subscriptionIDs}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipes archiveSubscriptions', err.code || 520, err.name || 'unhandledError_recipes-archiveSubscriptions', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  function singularUnit(ingredient) {
    // use switch case to convert plural units to singular, return the ingredient
    switch (ingredient.measurementUnit) {
      case 'bags':
        ingredient.measurementUnit = 'bag';
        break;
      case 'bars':
        ingredient.measurementUnit = 'bar';
        break;
      case 'blocks':
        ingredient.measurementUnit = 'block';
        break;
      case 'bottles':
        ingredient.measurementUnit = 'bottle';
        break;
      case 'boxes':
        ingredient.measurementUnit = 'box';
        break;
      case 'bunches':
        ingredient.measurementUnit = 'bunch';
        break;
      case 'cans':
        ingredient.measurementUnit = 'can';
        break;
      case 'cartons':
        ingredient.measurementUnit = 'carton';
        break;
      case 'containers':
        ingredient.measurementUnit = 'container';
        break;
      case 'cloves':
        ingredient.measurementUnit = 'clove';
        break;
      case 'cups':
        ingredient.measurementUnit = 'cup';
        break;
      case 'dashes':
        ingredient.measurementUnit = 'dash';
        break;
      case 'dozens':
        ingredient.measurementUnit = 'dozen';
        break;
      case 'drizzles':
        ingredient.measurementUnit = 'drizzle';
        break;
      case 'drops':
        ingredient.measurementUnit = 'drop';
        break;
      case 'fillets':
        ingredient.measurementUnit = 'fillet';
        break;
      case 'fluidOunces':
        ingredient.measurementUnit = 'fluidOunce';
        break;
      case 'heads':
        ingredient.measurementUnit = 'head';
        break;
      case 'kernels':
        ingredient.measurementUnit = 'kernel';
        break;
      case 'teaspoons':
        ingredient.measurementUnit = 'teaspoon';
        break;
      case 'tablespoons':
        ingredient.measurementUnit = 'tablespoon';
        break;
      case 'ounces':
        ingredient.measurementUnit = 'ounce';
        break;
      case 'gallons':
        ingredient.measurementUnit = 'gallon';
        break;
      case 'grams':
        ingredient.measurementUnit = 'gram';
        break;
      case 'kilograms':
        ingredient.measurementUnit = 'kilogram';
        break;
      case 'leafs':
        ingredient.measurementUnit = 'leaf';
        break;
      case 'liters':
        ingredient.measurementUnit = 'liter';
        break;
      case 'loaves':
        ingredient.measurementUnit = 'loaf';
        break;
      case 'milliliters':
        ingredient.measurementUnit = 'milliliter';
        break;
      case 'packets':
        ingredient.measurementUnit = 'packet';
        break;
      case 'pallets':
        ingredient.measurementUnit = 'pallet';
        break;
      case 'pinches':
        ingredient.measurementUnit = 'pinch';
        break;
      case 'pints':
        ingredient.measurementUnit = 'pint';
        break;
      case 'pounds':
        ingredient.measurementUnit = 'pound';
        break;
      case 'quarts':
        ingredient.measurementUnit = 'quart';
        break;
      case 'ribs':
        ingredient.measurementUnit = 'rib';
        break;
      case 'sheets':
        ingredient.measurementUnit = 'sheet';
        break;
      case 'singles':
        ingredient.measurementUnit = 'single';
        break;
      case 'slices':
        ingredient.measurementUnit = 'slice';
        break;
      case 'sprigs':
        ingredient.measurementUnit = 'sprig';
        break;
      case 'sprinkles':
        ingredient.measurementUnit = 'sprinkle';
        break;
      case 'stalks':
        ingredient.measurementUnit = 'stalk';
        break;
      case 'sticks':
        ingredient.measurementUnit = 'stick';
        break;
      case 'strips':
        ingredient.measurementUnit = 'strip';
        break;
      case 'weightOunces':
        ingredient.measurementUnit = 'weightOunce';
        break;
      default:
        break;
    }
    return ingredient;
  }

  return {
    get: {
      subscriptionsByRecipeID: getRecipeSubscriptionsByRecipeID,
      subscriptions: getRecipeSubscriptions,
      all: getAll,
      byID: getByID,
      ingredients: getRecipeIngredients,
      tools: getRecipeTools,
      steps: getRecipeSteps,
      discover: getDiscover,
    },
    constructRecipe,
    create,
    createVision,
    createFromURL,
    update,
    delete: deleteRecipe,
    use: useRecipe,
    subscribe: subscribeRecipe,
    unsubscribe: deleteRecipeSubscription,
    archiveCreatedRecipes,
    archiveSubscriptions,
  };
};
