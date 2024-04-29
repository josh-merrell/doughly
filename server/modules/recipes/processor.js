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

module.exports = ({ db }) => {
  async function constructRecipe(options) {
    try {
      //start timer
      const constructStartTime = new Date();
      const { sourceRecipeID, recipeCategoryID, authorization, userID, title, servings, lifespanDays, type = 'subscription', timePrep, timeBake, photoURL, ingredients, tools, steps } = options;

      let recipeID;
      const createdItems = [];
      try {
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
        global.logger.info(`UNIQUE NAME INGREDIENTS: ${JSON.stringify(uniqueNameIngredients)}`);
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
        global.logger.info(`UNIQUE NAME INGREDIENTS AFTER GETTING INGREDIENTID: ${JSON.stringify(uniqueNameIngredients)}`);
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
            global.logger.error(`'constructRecipe' Failed when creating recipeIngredients. Rolled-back. Failure: ${result.reason}`);
            throw errorGen(`'constructRecipe' Failed when creating recipeIngredients. Rolled-back. Failure: ${result.reason}`, 400);
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
              // throw new Error(`Failed when creating recipeTools. Rolled-back. Failure: ${result.reason}`);
              global.logger.error(`'constructRecipe' Failed when creating recipeTools. Rolled-back. Failure: ${result.reason}`);
              throw errorGen(`'constructRecipe' Failed when creating recipeTools. Rolled-back. Failure: ${result.reason}`, 400);
            }
          }
        }

        const stepPromises = steps.map((s) => constructRecipeStep(s, authorization, userID, recipe.recipeID));
        const stepResults = await Promise.allSettled(stepPromises);
        for (const result of stepResults) {
          if (result.status === 'fulfilled') {
            createdItems.push({ stepID: result.value.stepID });
          } else {
            // throw new Error(`Failed when creating recipeSteps. Rolled-back. Failure: ${result.reason}`);
            global.logger.error(`'constructRecipe' Failed when creating recipeSteps. Rolled-back. Failure: ${result.reason}`);
            throw errorGen(`'constructRecipe' Failed when creating recipeSteps. Rolled-back. Failure: ${result.reason}`, 400);
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
            // throw subscriptionError;
            global.logger.error(`'constructRecipe' Failed when creating recipeSubscription. Failure: ${subscriptionError}`);
            throw errorGen(`'constructRecipe' Failed when creating recipeSubscription. Failure: ${subscriptionError}`, 400);
          }
          createdItems.push({ subscriptionID: subscriptionID });

          //get current version of source recipe and update newRecipe version to match
          const { data: sourceRecipe, error: sourceRecipeError } = await db.from('recipes').select('version').eq('recipeID', sourceRecipeID).eq('deleted', false).single();
          if (sourceRecipeError) {
            global.logger.error(`'constructRecipe' Failed when getting sourceRecipe. Failure: ${sourceRecipeError}`);
            throw errorGen(`'constructRecipe' Failed when getting sourceRecipe. Failure: ${sourceRecipeError}`, 400);
          }
          const { error: updateError } = await db.from('recipes').update({ version: sourceRecipe.version }).eq('recipeID', recipe.recipeID);
          if (updateError) {
            global.logger.error(`'constructRecipe' Failed when updating newRecipe version. Failure: ${updateError}`);
            throw errorGen(`'constructRecipe' Failed when updating newRecipe version. Failure: ${updateError}`, 400);
          }
        }

        // Stop timer and calculate duration
        const constructEndTime = new Date();
        const constructDuration = constructEndTime - constructStartTime;
        global.logger.info(`Successfully constructed recipe ${recipe.recipeID}`);
        global.logger.info(`*TIME* constructRecipe: ${constructDuration / 1000} seconds`);
        return { recipeID: recipe.recipeID };
      } catch (error) {
        //rollback any created recipe items (the API endpoint will delete associated recipeIngredients, recipeTools, and recipeSteps)
        if (recipeID) {
          await deleteItem({ recipeID: recipeID }, authorization);
          for (let i in createdItems) {
            deleteItem(createdItems[i], authorization);
          }
        }
        global.logger.error(`'constructRecipe' Failed to construct Recipe. ${error.message}`);
        throw errorGen(`'constructRecipe' Failed to construct Recipe. ${error.message}`, 400);
      }
    } catch (error) {
      global.logger.error(`'constructRecipe' Unhandled Error: ${error.message}`);
      throw errorGen(`'constructRecipe' Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getIngredientID(ingredientName, ingredientGroup, userID, authorization) {
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
    global.logger.info(`CREATED ING, NOW INGREDIENTID IS: ${ingredientID}`);
    // return ingredientID
    return ingredientID;
  }

  async function constructRecipeIngredient(ingredient, authorization, userID, recipeID) {
    global.logger.info(`CONSTRUCT RI: ${JSON.stringify(ingredient)}`);
    if (!ingredient.ingredientID || ingredient.ingredientID === 0) {
      global.logger.error(`'constructRecipeIngredient' ingredientID is 0. Cannot create recipeIngredient without a valid ingredientID`);
      throw errorGen(`'constructRecipeIngredient' ingredientID is 0. Cannot create recipeIngredient without a valid ingredientID`, 400);
    }
    // Then, create the recipeIngredient
    try {
      global.logger.info(
        `CALLING RI CREATE WITH BODY: ${JSON.stringify({
          recipeID,
          ingredientID: ingredient.ingredientID,
          measurementUnit: ingredient.measurementUnit,
          measurement: ingredient.measurement,
          purchaseUnitRatio: ingredient.purchaseUnitRatio,
          preparation: ingredient.preparation,
          component: ingredient.component,
          RIneedsReview: ingredient.RIneedsReview || false,
        })}`,
      );
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
    } catch (error) {
      global.logger.error(`'constructRecipeIngredient' Failed when creating recipeIngredient. Failure: ${error.message}`);
      throw errorGen(`'constructRecipeIngredient' Failed when creating recipeIngredient. Failure: ${error.message}`, 400);
    }
  }

  async function constructRecipeTool(tool, authorization, userID, recipeID) {
    global.logger.info(`CONSTRUCT RT: ${tool}`);
    let toolID;
    try {
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
        global.logger.info(`CREATED DUMMY RT AND RETURNING`);
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
        global.logger.info(`CREATED TOOL, NOW TOOLID IS: ${toolID}`);
      } else {
        toolID = Number(tool.toolID);
        global.logger.info(`TOOLID IS: ${toolID}`);
      }
    } catch (error) {
      global.logger.error(`'constructRecipeTool' Failed when creating new tool. Failure: ${error.message}`);
      throw errorGen(`'constructRecipeTool' Failed when creating new tool. Failure: ${error.message}`, 400);
    }
    // Then, create the recipeTool
    try {
      global.logger.info(
        `CALLING RT CREATE WITH BODY: ${JSON.stringify({
          recipeID,
          toolID,
          quantity: tool.quantity,
        })}`,
      );
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
    } catch (error) {
      global.logger.error(`'constructRecipeTool' Failed when creating recipeTool. Failure: ${error.message}`);
      throw errorGen(`'constructRecipeTool' Failed when creating recipeTool. Failure: ${error.message}`, 400);
    }
  }

  async function constructRecipeStep(step, authorization, userID, recipeID) {
    let stepID;
    try {
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
    } catch (error) {
      global.logger.error(`'constructRecipeStep' Failed when creating new step. Failure: ${error.message}`);
      throw errorGen(`'constructRecipeStep' Failed when creating new step. Failure: ${error.message}`, 400);
    }
    // Then, create the recipeStep
    try {
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
      global.logger.error(`'constructRecipeStep' Failed when creating recipeStep. Failure: ${error.message}`);
      throw errorGen(`'constructRecipeStep' Failed when creating recipeStep. Failure: ${error.message}`, 400);
    }
  }

  async function deleteItem(item, authorization) {
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
  }

  async function getAll(options) {
    try {
      const { userID, recipeIDs, title, recipeCategoryID } = options;
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
        global.logger.error(`Error getting recipes: ${error.message}`);
        throw errorGen(`Error getting recipes: ${error.message}`, 400);
      }
      global.logger.info(`Got ${recipes.length} recipes`);
      return recipes;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getDiscover() {
    try {
      // const { userID, authorization } = options;
      const { data: discoverRecipes, error } = await db.from('recipes').select().eq('discoverPage', true).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting discoverRecipes: ${error.message}`);
        throw errorGen(`Error getting discoverRecipes: ${error.message}`, 400);
      }
      global.logger.info(`Got ${discoverRecipes.length} discoverRecipes`);
      return discoverRecipes;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getByID(options) {
    try {
      const { recipeID } = options;
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipe: ${recipeID}: ${error.message}`);
        throw errorGen(`Error getting recipe: ${recipeID}: ${error.message}`, 400);
      }
      global.logger.info(`Got recipe`);
      return recipe;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getRecipeIngredients(options) {
    try {
      const { recipeID } = options;
      const { data: recipeIngredients, error } = await db.from('recipeIngredients').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipeIngredients for recipeID: ${recipeID}: ${error.message}`);
        throw errorGen(`Error getting recipeIngredients for recipeID: ${recipeID}: ${error.message}`, 400);
      }
      global.logger.info(`Got ${recipeIngredients.length} recipeIngredients for recipeID: ${recipeID}`);
      return recipeIngredients;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getRecipeTools(options) {
    try {
      const { recipeID } = options;
      const { data: recipeTools, error } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipeTools for recipeID: ${recipeID}: ${error.message}`);
        throw errorGen(`Error getting recipeTools for recipeID: ${recipeID}: ${error.message}`, 400);
      }
      global.logger.info(`Got ${recipeTools.length} recipeTools for recipeID: ${recipeID}`);
      return recipeTools;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getRecipeSteps(options) {
    try {
      const { recipeID } = options;
      const { data: recipeSteps, error } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);

      if (error) {
        global.logger.error(`Error getting recipeSteps for recipeID: ${recipeID}: ${error.message}`);
        throw errorGen(`Error getting recipeSteps for recipeID: ${recipeID}: ${error.message}`, 400);
      }
      global.logger.info(`Got ${recipeSteps.length} recipeSteps for recipeID: ${recipeID}`);
      return recipeSteps;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getRecipeSubscriptions(options) {
    try {
      const { userID, authorization } = options;
      const { data: subscriptions, error } = await db.from('recipeSubscriptions').select('subscriptionID, sourceRecipeID, newRecipeID, startDate').eq('userID', userID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipeSubscriptions for userID: ${userID}: ${error.message}`);
        throw errorGen(`Error getting recipeSubscriptions for userID: ${userID}: ${error.message}`, 400);
      }
      const enhancedSubscriptions = [];
      for (let i = 0; i < subscriptions.length; i++) {
        // get source recipe using axios endpoint
        const { data: sourceRecipe, error: sourceRecipeError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${subscriptions[i].sourceRecipeID}`, { headers: { authorization } });
        if (sourceRecipeError) {
          global.logger.error(`Error getting sourceRecipe for subscriptionID: ${subscriptions[i].subscriptionID}: ${sourceRecipeError.message}`);
          throw errorGen(`Error getting sourceRecipe for subscriptionID: ${subscriptions[i].subscriptionID}: ${sourceRecipeError.message}`, 400);
        }
        global.logger.info(`sourceRecipe: ${JSON.stringify(sourceRecipe[0])}`);

        // get profile using axios endpoint providing userID in query
        const { data: profile, error: profileError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/profiles?userID=${sourceRecipe[0].userID}`, { headers: { authorization } });
        if (profileError) {
          global.logger.error(`Error getting profile for userID: ${sourceRecipe[0].userID}: ${profileError.message}`);
          throw errorGen(`Error getting profile for userID: ${sourceRecipe[0].userID}: ${profileError.message}`, 400);
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
      global.logger.info(`Got ${subscriptions.length} recipeSubscriptions for userID: ${userID}`);
      return enhancedSubscriptions;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function getRecipeSubscriptionsByRecipeID(options) {
    try {
      const { recipeID } = options;
      const { data: subscriptions, error } = await db.from('recipeSubscriptions').select('subscriptionID, sourceRecipeID, newRecipeID, startDate').eq('sourceRecipeID', recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipeSubscriptions for recipeID: ${recipeID}: ${error.message}`);
        throw errorGen(`Error getting recipeSubscriptions for recipeID: ${recipeID}: ${error.message}`, 400);
      }
      global.logger.info(`Found ${subscriptions.length} recipeSubscriptions for recipeID: ${recipeID}`);
      return subscriptions;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function create(options) {
    try {
      const { customID, authorization, userID, title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = options;
      const status = 'noIngredients';

      if (!title) {
        global.logger.error(`Title is required`);
        throw errorGen(`Title is required`, 400);
      }
      if (!servings || servings < 0) {
        global.logger.error(`positive Servings integer is required`);
        throw errorGen(`positive Servings integer is required`, 400);
      }
      if (!lifespanDays || lifespanDays < 0) {
        global.logger.error(`positive LifespanDays integer is required`);
        throw errorGen(`positive LifespanDays integer is required`, 400);
      }
      if (!timePrep || timePrep < 0) {
        global.logger.error(`positive TimePrep integer is required`);
        throw errorGen(`positive TimePrep integer is required`, 400);
      }
      if (timeBake && timeBake < 1) {
        global.logger.error(`positive TimeBake integer is required`);
        throw errorGen(`positive TimeBake integer is required`, 400);
      }

      //verify that the provided recipeCategoryID exists, return error if not
      if (recipeCategoryID) {
        const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
        if (error) {
          global.logger.error(`Error getting recipeCategory: ${error.message}`);
          throw errorGen(`Error getting recipeCategory: ${error.message}`, 400);
        }
        if (!recipeCategory.length) {
          global.logger.error(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
          throw errorGen(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`, 400);
        }
      }

      //create recipe
      const { data: recipe, error } = await db.from('recipes').insert({ recipeID: customID, userID, title, servings, lifespanDays, recipeCategoryID, status, timePrep, timeBake, photoURL, version: 1, type }).select().single();

      if (error) {
        global.logger.error(`Error creating recipe: ${error.message}`);
        throw errorGen(`Error creating recipe: ${error.message}`, 400);
      }

      //add a 'created' log entry
      createRecipeLog(userID, authorization, 'createRecipe', recipe.recipeID, null, null, null, `Created Recipe: ${recipe.title}`);

      global.logger.info(`Created recipe ID:${recipe.recipeID}`);
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
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID) {
    try {
      // validate resulting json, return if it lacks minimum requirements
      if (recipeJSON.error) {
        if (recipeJSON.error === 10) {
          global.logger.error(`The provided image does not show enough recipe details or is not clear enough to be analyzed. Please try again with a different image.`);
          throw errorGen(`The provided image does not show enough recipe details or is not clear enough to be analyzed. Please try again with a different image.`, 400);
        }
        global.logger.error(`Could not analyze the provided image: ${recipeJSON.error}. Please try again later`);
        throw errorGen(`Could not analyze the provided image: ${recipeJSON.error}. Please try again later`, 400);
      }
      if (!recipeJSON.title) {
        global.logger.error(`no recipe title found in image`);
        throw errorGen(`no recipe title found in image`, 400);
      }
      // save recipeJSON to file
      // const sanitizedTitle = recipeJSON.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // const recipeJSONPath = path.join(__dirname, `../../data/recipes/${sanitizedTitle}.json`);
      // if (!fs.existsSync(path.dirname(recipeJSONPath))) {
      //   fs.mkdirSync(path.dirname(recipeJSONPath), { recursive: true });
      // }
      global.logger.info(`RECIPE JSON: ${JSON.stringify(recipeJSON)}`);
      // fs.writeFileSync(recipeJSONPath, JSON.stringify(recipeJSON));

      if (!recipeJSON.category) {
        global.logger.error(`no recipe category found in image`);
        throw errorGen(`no recipe category found in image`, 400);
      }

      sendSSEMessage(userID, { message: `General Recipe details look good, checking ingredient details...` });
      // validate recipe settings
      recipeJSON.servings = Math.floor(recipeJSON.servings) || 1;

      // validate returned ingredients
      if (recipeJSON.ingredients.length < 1) {
        global.logger.error(`no ingredients found in image`);
        throw errorGen(`no ingredients found in image`, 400);
      }
      const units = process.env.MEASUREMENT_UNITS.split(',');

      const indexesToRemove = new Set();
      for (let i = 0; i < recipeJSON.ingredients.length; i++) {
        if (!recipeJSON.ingredients[i].name) {
          global.logger.error(`ingredient missing name. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`);
          indexesToRemove.add(i);
        }
        if (!recipeJSON.ingredients[i].measurement || recipeJSON.ingredients[i].measurement <= 0) {
          global.logger.error(`missing or invalid ingredient measurement, removing from array. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`);
          indexesToRemove.add(i);
        }
        if (!recipeJSON.ingredients[i].measurementUnit) {
          global.logger.error(`missing ingredient measurementUnit: JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`);
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
            global.logger.error(`invalid ingredient measurementUnit, removing from array. JSON: ${JSON.stringify(recipeJSON.ingredients[i])}`);
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
            global.logger.error(`tool missing name`);
            throw errorGen(`tool missing name`, 400);
          }
          if (recipeJSON.tools[i].quantity < 0) {
            global.logger.error(`invalid tool quantity`);
            throw errorGen(`invalid tool quantity`, 400);
          }
          if (!recipeJSON.tools[i].quantity) {
            recipeJSON.tools[i]['quantity'] = 1;
          }
        }
      }

      //validate return steps
      sendSSEMessage(userID, { message: `Checking step details...` });
      if (recipeJSON.steps.length < 1) {
        global.logger.error(`no recipe steps found in image`);
        throw errorGen(`no recipe steps found in image`, 400);
      }

      const toolIndexesToRemove = new Set();
      recipeJSON.steps = addStepSequences(recipeJSON.steps);
      for (let i = 0; i < recipeJSON.steps.length; i++) {
        if (!recipeJSON.steps[i].title) {
          global.logger.error(`step missing title`);
          toolIndexesToRemove.add(i);
        }
        if (!recipeJSON.steps[i].description) {
          global.logger.error(`step missing description`);
          toolIndexesToRemove.add(i);
        }
        // if (!recipeJSON.steps[i].sequence || recipeJSON.steps[i].sequence < 1) {
        //   global.logger.error(`missing or invalid step sequence`);
        //   toolIndexesToRemove.add(i);
        // }
        recipeJSON.steps[i].stepID = 0;
      }
      // remove invalid steps from array
      for (let i of Array.from(toolIndexesToRemove).sort((a, b) => b - a)) {
        recipeJSON.steps.splice(i, 1);
      }

      // get user ingredients from supabase
      const { data: userIngredients, error: userIngredientsError } = await db.from('ingredients').select('name, purchaseUnit, ingredientID, gramRatio').eq('userID', userID).eq('deleted', false);
      if (userIngredientsError) {
        global.logger.error(`Error getting userIngredients: ${userIngredientsError.message}`);
        throw errorGen(`Error getting userIngredients: ${userIngredientsError.message}`, 400);
      }

      // match ingredients with user Ingredients
      sendSSEMessage(userID, { message: `Matching recipe Ingredients with User Ingredients` });
      let matchedIngredientsResponse = await matchIngredients(recipeJSON.ingredients, authorization, userID, userIngredients);
      let matchedIngredients = matchedIngredientsResponse.matchedTwiceIngredients;

      // **************** ADD UNIT RATIOS TO MATCHED INGREDIENTS ***************
      let unitRatioCost = 0;
      // add purchaseUnitRatios to ingredients in parrallel
      const ingredientPurchaseUnitRatioPromises = [];
      global.logger.info(`ADDING PURCHASEUNITRATIOS TO MATCHED INGREDIENTS`);
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
              global.logger.info(`GOT RESULT FROM AI PUR ESTIMATE: ${JSON.stringify(result)}`);
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
          global.logger.error(`Invalid purchaseUnitRatio for ingredient ${i.name}: ${i.purchaseUnitRatio}, removing from recipe.`);
          return false;
        }
      });
      global.logger.info(`DONE ADDING PURCHASEUNITRATIOS TO MATCHED INGREDIENTS, MATCHED INGREDIENTS: ${JSON.stringify(matchedIngredients)}`);

      // if ingredientID is 0, also need to get gramRatio
      const ingredientGramRatioPromises = [];
      for (let i = 0; i < matchedIngredients.length; i++) {
        if (matchedIngredients[i].ingredientID === 0) {
          global.logger.info(`ADDING GRAMRATIO TO NEW INGREDIENT: ${JSON.stringify(matchedIngredients[i])}`);
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
      global.logger.info(`PRE FILTER: ${JSON.stringify(matchedIngredients)}`);
      // remove any ingredients that have ingredientID of 0 and a gramRatio that is missing or less than 1
      matchedIngredients = matchedIngredients.filter((i) => {
        if (i.ingredientID !== 0) {
          return true;
        }
        if (!i.gramRatio || i.gramRatio <= 0 || typeof i.gramRatio !== 'number') {
          global.logger.error(`Invalid gramRatio for ingredient ${i.name}: ${i.gramRatio}, removing from recipe.`);
          return false;
        }
        return true;
      });

      global.logger.info(`DONE ADDING GRAMRATIO TO MATCHED INGREDIENTS. MATCHED INGREDIENTS: ${JSON.stringify(matchedIngredients)}`);
      // ***************************************************************************

      // match tools with user tools
      sendSSEMessage(userID, { message: `Matching recipe Tools with User Tools` });
      const matchedTools = await matchTools(recipeJSON.tools, authorization, userID);

      // match category
      sendSSEMessage(userID, { message: `Finding Appropriate Category for new Recipe` });
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
      global.logger.info(`CALLING CONSTRUCT WITH BODY: ${JSON.stringify(constructBody)}`);
      if (recipePhotoURL) {
        constructBody['photoURL'] = recipePhotoURL;
      }
      // console.log(`CONSTRUCT BODY: ${JSON.stringify(constructBody)}`)

      // call constructRecipe with body
      sendSSEMessage(userID, { message: `Details ready, building new Recipe` });
      const { data: recipeID, error: constructError } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/constructed`, constructBody, { headers: { authorization } });
      if (constructError) {
        global.logger.error(`Error constructing recipe from image details: ${constructError.message}`);
        throw errorGen(`Error constructing recipe from image details: ${constructError.message}`, 400);
      }
      // const recipeID = recipe.recipeID;

      // fix the vertexaiCost to 4 decimals
      const vertexaiCost = parseFloat(matchedIngredientsResponse.vertexaiCost).toFixed(4);
      global.logger.info(`vertexAI Cost (all ingr) to find match and get PU/LD: ${vertexaiCost}`);
      const vertexaiUnitConversionCost = parseFloat(unitRatioCost).toFixed(4);
      global.logger.info(`vertexAI Cost (all unit conversion): ${vertexaiUnitConversionCost}`);
      sendSSEMessage(userID, { message: `done` });
      return recipeID;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
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
    try {
      const { userID, recipeSourceImageURL, recipePhotoURL, authorization } = options;

      // call openaiHandler to build recipe json
      let elapsedTime = 0;
      const timer = setInterval(() => {
        elapsedTime += 1;
        sendSSEMessage(userID, { message: `Getting recipe details from image. This should take less than a minute. Elapsed Time: ${elapsedTime}` });
      }, 1000); // Send progress update every second
      global.logger.info(`Calling visionRequest`);
      const visionStartTime = new Date();
      const { response, error } = await visionRequest(recipeSourceImageURL, userID, authorization, 'generateRecipeFromImage');
      if (error) {
        global.logger.error(`Error creating recipe from vision: ${error.message}`);
        throw errorGen(`Error creating recipe from vision: ${error.message}`, 400);
      }
      clearInterval(timer);
      const recipeJSON = JSON.parse(response);
      // Stop timer and calculate duration
      const visionEndTime = new Date();
      const visionDuration = visionEndTime - visionStartTime; // duration in milliseconds
      sendSSEMessage(userID, { message: `Got recipe details from image in ${visionDuration / 1000} seconds` });
      global.logger.info(`*TIME* recipe visionRequest: ${visionDuration / 1000} seconds`);

      const recipeID = await processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID);

      const endTime = new Date();
      const totalDuration = endTime - visionStartTime;
      global.logger.info(`*TIME* vison recipe and construct total: ${totalDuration / 1000} seconds`);

      return recipeID;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function createFromURL(options) {
    const { userID, recipeURL, recipePhotoURL, authorization } = options;

    // max attempts to create recipe from URL
    const maxAttempts = 3;

    // attempt to create recipe from URL
    let recipeID;
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        global.logger.info(`Attempt ${attempt} to create recipe from URL: ${recipeURL}`);
        recipeID = await createFromURLAttempt(userID, authorization, recipeURL, recipePhotoURL);
        break;
      } catch (error) {
        global.logger.error(`Error creating recipe from URL: ${error.message}`);
        if (attempt === maxAttempts) {
          throw errorGen(`Error creating recipe from URL: ${error.message}`, 400);
        }
        attempt++;
      }
    }
    global.logger.info(`Created recipe from URL: ${recipeURL}`);
    return recipeID;
  }

  async function createFromURLAttempt(userID, authorization, recipeURL, recipePhotoURL) {
    global.logger.info(`Creating recipe from URL: ${recipeURL}`);
    try {
      // call openaiHandler to build recipe json
      let elapsedTime = 0;
      const timer = setInterval(() => {
        elapsedTime += 1;
        sendSSEMessage(userID, { message: `Getting recipe details from web page. This should be quick. Elapsed Time: ${elapsedTime}` });
      }, 1000); // Send progress update every second
      global.logger.info(`Calling urlRequest`);

      // start timer
      const visionStartTime = new Date();

      // call 'getHtml' to get recipe details from URL
      const { html, error } = await getHtml(recipeURL, userID, authorization, 'generateRecipeFromURL');
      if (error) {
        global.logger.error(`Error getting Source Recipe details. Can't create recipe: ${error.message}`);
        throw errorGen(`Error getting Source Recipe details. Can't create recipe: ${error.message}`, 400);
      }
      clearInterval(timer);

      const htmlText = await extractFromHtml(html);
      if (!htmlText) {
        global.logger.error(`Error extracting recipe details from URL: ${recipeURL}`);
        throw errorGen(`Error extracting recipe details from URL: ${recipeURL}`, 400);
      }

      global.logger.info(`HTML TEXT: ${htmlText}`);
      // call openaiHandler to build recipe json
      const result = await recipeFromTextRequest(htmlText, userID, authorization);
      // const recipeJSON = result.response;
      const recipeJSON = JSON.parse(result.response);

      const recipeID = await processRecipeJSON(recipeJSON, recipePhotoURL, authorization, userID);

      const endTime = new Date();
      const totalDuration = endTime - visionStartTime;
      // global.logger.info(`Time taken to decipher and construct recipe: ${totalDuration / 1000} seconds`);
      global.logger.info(`*TIME* URL recipe and construct total: ${totalDuration / 1000} seconds`);

      return recipeID;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function matchIngredients(ingredients, authorization, userID, userIngredients) {
    const userIngredientsInfo = userIngredients.map((i) => {
      return { name: i.name, ingredientID: i.ingredientID, purchaseUnit: i.purchaseUnit, needsReview: true };
    });
    const matchedIngredients = [];

    // First, search for exact name match
    for (let i = 0; i < ingredients.length; i++) {
      const primaryMatchResult = await matchIngredientByName(userID, authorization, ingredients[i], userIngredientsInfo);
      matchedIngredients.push(primaryMatchResult);
    }
    global.logger.info(`MATCHED INGREDIENTS AFTER PRIMARY METHOD: ${JSON.stringify(matchedIngredients)}`);

    const matchedTwiceIngredients = [];
    // Fallback to try using AI to find matches
    const promises = [];
    const userIngredientNames = userIngredients.map((i) => i.name);
    for (let i = 0; i < matchedIngredients.length; i++) {
      // if the matchedIngredient has an ingredientID of 0, we need to try asking AI to match it with an existing userIngredient. Make a promise of each call to the 'matchRecipeItemRequest' function and add to promises array. If the ingredientID is not 0, we already found a match and can skip this item.
      if (matchedIngredients[i].ingredientID === 0) {
        global.logger.info(`MATCHED INGREDIENT ${matchedIngredients[i].name} HAS INGREDIENTID 0, ATTEMPTING TO MATCH WITH AI`);
        promises.push(
          matchRecipeIngredientRequest(userID, authorization, matchedIngredients[i].name, userIngredientNames)
            .then((data) => {
              const ingredientJSON = data.response;
              if (ingredientJSON.error) {
                global.logger.error(`Error matching ingredient with AI: ${ingredientJSON.error}`);
                return { ...matchedIngredients[i], invalid: true, cost: data.cost };
              }
              global.logger.info(`AI MATCHED INGREDIENT: ${JSON.stringify(ingredientJSON)}`);
              if (ingredientJSON.foundMatch) {
                const ingredientID = userIngredients.find((i) => i.name === ingredientJSON.ingredientName);
                if (!ingredientID) {
                  global.logger.error(`Error matching ingredient with AI: ${ingredientJSON.error}`);
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
                  global.logger.error(`AI provided Invalid lifespanDays for ingredient ${matchedIngredients[i].name}: ${ingredientJSON.lifespanDays}, removing from recipe.`);
                  return { ...matchedIngredients[i], invalid: true, cost: data.cost };
                }
                if (!validUnits.includes(ingredientJSON.purchaseUnit)) {
                  global.logger.error(`AI provided Invalid purchaseUnit for ingredient ${matchedIngredients[i].name}: ${ingredientJSON.purchaseUnit}, removing from recipe.`);
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
              global.logger.error(`Error matching ingredient with AI: ${error.message}`);
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
        global.logger.error(`Invalid ingredient: ${JSON.stringify(results[i])}`);
        //don't add invalid ingredients to the matchedTwiceIngredients array
      }
      if (results[i].status === 'fulfilled' && results[i].value && !results[i].value.invalid) {
        global.logger.info(`PUSHING AI MATCHED INGREDIENT TO MATCHEDTWICEINGREDIENTS: ${JSON.stringify(results[i].value)}`);
        matchedTwiceIngredients.push(results[i].value);
      }
    }

    return { matchedTwiceIngredients, vertexaiCost };
  }

  async function matchIngredientByName(userID, authorization, recipeIngredient, userIngredientNames) {
    // search for exact name match (case-insensitive) among existing user ingredients for provided recipe ingredient. If one is found, return resulting recipeIngredient with ingredientID and retrieved purchasedUnitRatio, also including the 'needsReview' value provided by getPurchaseUnitRatio. If no match is found, return recipeIngredient with ingredientID of 0.
    global.logger.info(`IN PRIMARY INGREDIENT NAME MATCH. RI: ${JSON.stringify(recipeIngredient)}`);

    const userIngredientMatch = userIngredientNames.find((i) => i.name.toLowerCase() === recipeIngredient.name.toLowerCase());

    if (userIngredientMatch) {
      global.logger.info(`FOUND MATCH FOR ${recipeIngredient.name} in ${JSON.stringify(userIngredientMatch)}`);

      try {
        global.logger.info(`GETTING PUR FOR ${recipeIngredient.name} ${recipeIngredient.measurementUnit} and ${userIngredientMatch.purchaseUnit}`);
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
        global.logger.info(`PUR RESULT: ${purchaseUnitRatio}`);

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
      } catch (error) {
        global.logger.error(`Error getting unitRatioEstimate from openAI: ${error.message}`);
        throw errorGen(`Error in secondaryIngredientMatch: ${error.message}`, 400);
      }
    }

    global.logger.info(`NO MATCH FOUND FOR ${recipeIngredient.name}`);
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
  }

  async function matchTools(tools, authorization, userID) {
    // get user tools from supabase
    const { data: userTools, error: userToolsError } = await db.from('tools').select('name, toolID').eq('userID', userID).eq('deleted', false);
    if (userToolsError) {
      global.logger.error(`Error getting userTools: ${userToolsError.message}`);
      throw errorGen(`Error getting userTools: ${userToolsError.message}`, 400);
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
          global.logger.error(`Error matching tool: ${error.message}`);
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
  }

  async function secondaryToolsMatch(recipeTool, userTools) {
    global.logger.info(`IN SECONDARY TOOLS MATCH. RT: ${JSON.stringify(recipeTool)}`);
    const userToolMatch = userTools.find((t) => t.name.toLowerCase() === recipeTool.name.toLowerCase());
    if (userToolMatch) {
      global.logger.info(`FOUND MATCH FOR ${recipeTool.name} in ${JSON.stringify(userToolMatch)}`);
      return { toolID: Number(userToolMatch.toolID), name: recipeTool.name, quantity: recipeTool.quantity };
    }
    global.logger.info(`NO MATCH FOUND FOR ${recipeTool.name}`);
    return { toolID: 0, name: recipeTool.name, quantity: recipeTool.quantity };
  }

  async function matchCategory(recipeCategory, authorization, userID) {
    // get categories from supabase
    const { data: categories, error: categoriesError } = await db.from('recipeCategories').select('recipeCategoryID, name');
    if (categoriesError) {
      global.logger.error(`Error getting categories: ${categoriesError.message}`);
      throw errorGen(`Error getting categories: ${categoriesError.message}`, 400);
    }
    const { response, error } = await matchRecipeItemRequest(userID, authorization, 'findMatchingCategory', recipeCategory, categories);
    if (error) {
      global.logger.error(`Error matching category: ${error.message}`);
      throw errorGen(`Error matching category: ${error.message}`, 400);
    }
    const categoryJSON = JSON.parse(response);

    if (categoryJSON.recipeCategoryID) {
      return categoryJSON.recipeCategoryID;
    } else {
      // return recipeCategoryID for 'Other'
      return 2023112900000005;
    }
  }

  async function update(options) {
    try {
      const { recipeID, authorization, recipeCategoryID, timePrep, timeBake } = options;
      //verify that the provided recipeID exists, return error if not
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);

      if (error) {
        global.logger.error(`Error getting recipe: ${error.message}`);
        throw errorGen(`Error getting recipe: ${error.message}`, 400);
      }
      if (!recipe.length) {
        global.logger.error(`Recipe with provided ID (${recipeID}) does not exist`);
        throw errorGen(`Recipe with provided ID (${recipeID}) does not exist`, 400);
      }

      //verify that the provided recipeCategoryID exists, return error if not
      if (recipeCategoryID) {
        const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
        if (error) {
          global.logger.error(`Error getting recipeCategory: ${error.message}`);
          throw errorGen(`Error getting recipeCategory: ${error.message}`, 400);
        }
        if (!recipeCategory.length) {
          global.logger.error(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
          throw errorGen(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`, 400);
        }
      }

      //verify that servings, lifespanDays, timePrep, and timeBake are positive integers, if provided. Return error if not
      if (options.servings && options.servings < 1) {
        global.logger.error(`Servings should be positive integer`);
        throw errorGen(`Servings should be positive integer`, 400);
      }
      if (options.lifespanDays && options.lifespanDays < 1) {
        global.logger.error(`LifespanDays should be positive integer`);
        throw errorGen(`LifespanDays should be positive integer`, 400);
      }
      if (timePrep && timePrep < 1) {
        global.logger.error(`TimePrep should be positive integer`);
        throw errorGen(`TimePrep should be positive integer`, 400);
      }
      if (timeBake && timeBake < 1) {
        global.logger.error(`TimeBake should be positive integer`);
        throw errorGen(`TimeBake should be positive integer`, 400);
      }

      const updateFields = {};
      if (options.status) {
        //ensure provided status is valid value
        if (options.status !== 'noIngredients' && options.status !== 'noTools' && options.status !== 'noSteps' && options.status !== 'published') {
          global.logger.error(`Invalid status`);
          throw errorGen(`Invalid status`, 400);
        }
      }
      for (let key in options) {
        if (key !== 'recipeID' && options[key] !== undefined && key !== 'authorization') {
          updateFields[key] = options[key];
        }
      }

      try {
        const updatedRecipe = await updater(options.userID, authorization, 'recipeID', recipeID, 'recipes', updateFields);
        // if type was updated to 'public', call 'addFolloweePublicRecipeCreatedMessages'
        if (updateFields.type === 'public') {
          // messageProcessor.addFolloweePublicRecipeCreatedMessages({ userID: options.userID, recipeID: options.recipeID, recipeTitle: recipe.title });
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
      } catch (error) {
        global.logger.error(`Error calling updater: ${error.message}`);
        throw errorGen(`Error calling updater: ${error.message}`, 400);
      }
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function deleteRecipe(options) {
    try {
      //verify that the provided recipeID exists, return error if not
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipe: ${error.message}`);
        throw errorGen(`Error getting recipe: ${error.message}`, 400);
      }
      if (!recipe.length) {
        global.logger.error(`Recipe with provided ID (${options.recipeID}) does not exist`);
        throw errorGen(`Recipe with provided ID (${options.recipeID}) does not exist`, 400);
      }

      //if recipe has photoURL, delete photo from s3
      if (recipe[0].photoURL) {
        try {
          const url = `${process.env.NODE_HOST}:${process.env.PORT}/uploads/image?userID=${encodeURIComponent(options.userID)}&photoURL=${encodeURIComponent(recipe[0].photoURL)}&type=recipe&id=${options.recipeID}`;
          await axios.delete(url, { headers: { authorization: options.authorization } });
          global.logger.info(`Deleted photo for recipeID ${options.recipeID}`);
        } catch (error) {
          global.logger.error(`Error deleting recipe photo: ${error.message}`);
          throw errorGen(`Error deleting recipe photo: ${error.message}`, 400);
        }
      }

      //get list of related recipeComponents
      try {
        const { data: relatedRecipeComponents, error: componentError } = await db.from('recipeComponents').select().eq('recipeID', options.recipeID).eq('deleted', false);
        if (componentError) {
          global.logger.error(`Error getting related recipeComponents for recipe to delete: ${options.recipeID} : ${componentError.message}`);
          throw errorGen(`Error getting related recipeComponents for recipe to delete: ${options.recipeID} : ${componentError.message}`, 400);
        }

        //delete any associated recipeComponent entries;
        for (let i = 0; i < relatedRecipeComponents.length; i++) {
          const { data: recipeComponentDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeComponents/${relatedRecipeComponents[i].recipeComponentID}`, {
            headers: {
              authorization: options.authorization,
            },
          });
          if (recipeComponentDeleteResult.error) {
            global.logger.error(`Error deleting recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} prior to deleting recipe ID: ${options.recipeID} : ${recipeComponentDeleteResult.error}`);
            throw errorGen(`Error deleting recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} prior to deleting recipe ID: ${options.recipeID} : ${recipeComponentDeleteResult.error}`, 400);
          }

          //add a 'deleted' log entry
          createRecipeLog(options.userID, options.authorization, 'deleteRecipeComponent', Number(relatedRecipeComponents[i].recipeComponentID), Number(relatedRecipeComponents[i].recipeID), null, null, `deleted recipeComponent ID: ${relatedRecipeComponents[i].recipeComponentID}`);
        }
      } catch (error) {
        global.logger.error(`Error deleting related recipeComponents: ${error.message}`);
        throw errorGen(`Error deleting related recipeComponents: ${error.message}`, 400);
      }

      //get list of related recipeSteps
      try {
        const { data: relatedRecipeSteps, error: stepError } = await db.from('recipeSteps').select().eq('recipeID', options.recipeID).eq('deleted', false);
        if (stepError) {
          global.logger.error(`Error getting related recipeSteps for recipe to delete: ${options.recipeID} : ${stepError.message}`);
          throw errorGen(`Error getting related recipeSteps for recipe to delete: ${options.recipeID} : ${stepError.message}`, 400);
        }

        //delete any associated recipeSteps entries;
        for (let i = 0; i < relatedRecipeSteps.length; i++) {
          const { data: recipeStepDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/steps/recipe/${relatedRecipeSteps[i].recipeStepID}`, {
            headers: {
              authorization: options.authorization,
            },
          });
          if (recipeStepDeleteResult.error) {
            global.logger.error(`Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting recipe ID: ${options.recipeID} : ${recipeStepDeleteResult.error}`);
            throw errorGen(`Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting recipe ID: ${options.recipeID} : ${recipeStepDeleteResult.error}`, 400);
          }

          //add a 'deleted' log entry
          createRecipeLog(options.userID, options.authorization, 'deleteRecipeStep', Number(relatedRecipeSteps[i].recipeStepID), Number(relatedRecipeSteps[i].recipeID), null, null, `deleted recipeStep ID: ${relatedRecipeSteps[i].recipeStepID}`);
        }
      } catch (error) {
        global.logger.error(`Error deleting related recipeSteps: ${error.message}`);
        throw errorGen(`Error deleting related recipeSteps: ${error.message}`, 400);
      }

      //get list of related recipeTools
      try {
        const { data: relatedRecipeTools, error: toolError } = await db.from('recipeTools').select().eq('recipeID', options.recipeID).eq('deleted', false);
        if (toolError) {
          global.logger.error(`Error getting related recipeTools for recipe to delete: ${options.recipeID} : ${toolError.message}`);
          throw errorGen(`Error getting related recipeTools for recipe to delete: ${options.recipeID} : ${toolError.message}`, 400);
        }

        //delete any associated recipeTools entries;
        for (let i = 0; i < relatedRecipeTools.length; i++) {
          const { data: recipeToolDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/tools/recipe/${relatedRecipeTools[i].recipeToolID}`, {
            headers: {
              authorization: options.authorization,
            },
          });
          if (recipeToolDeleteResult.error) {
            global.logger.error(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting recipe ID: ${options.recipeID} : ${recipeToolDeleteResult.error}`);
            throw errorGen(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting recipe ID: ${options.recipeID} : ${recipeToolDeleteResult.error}`, 400);
          }

          //add a 'deleted' log entry
          createRecipeLog(options.userID, options.authorization, 'deleteRecipeTool', Number(relatedRecipeTools[i].recipeToolID), Number(relatedRecipeTools[i].recipeID), null, null, `deleted recipeTool ID: ${relatedRecipeTools[i].recipeToolID}`);
        }
      } catch (error) {
        global.logger.error(`Error deleting related recipeTools: ${error.message}`);
        throw errorGen(`Error deleting related recipeTools: ${error.message}`, 400);
      }

      //get list of related recipeIngredients
      try {
        const { data: relatedRecipeIngredients, error: ingredientError } = await db.from('recipeIngredients').select().eq('recipeID', options.recipeID).eq('deleted', false);
        if (ingredientError) {
          global.logger.error(`Error getting related recipeIngredients for recipe to delete: ${options.recipeID} : ${ingredientError.message}`);
          throw errorGen(`Error getting related recipeIngredients for recipe to delete: ${options.recipeID} : ${ingredientError.message}`, 400);
        }

        //delete any associated recipeIngredients entries;
        for (let i = 0; i < relatedRecipeIngredients.length; i++) {
          const { data: recipeIngredientDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe/${relatedRecipeIngredients[i].recipeIngredientID}`, {
            headers: {
              authorization: options.authorization,
            },
          });
          if (recipeIngredientDeleteResult.error) {
            global.logger.error(`Error deleting recipeIngredientID: ${relatedRecipeIngredients[i].recipeIngredientID} prior to deleting recipe ID: ${options.recipeID} : ${recipeIngredientDeleteResult.error}`);
            throw errorGen(`Error deleting recipeIngredientID: ${relatedRecipeIngredients[i].recipeIngredientID} prior to deleting recipe ID: ${options.recipeID} : ${recipeIngredientDeleteResult.error}`, 400);
          }

          //add a 'deleted' log entry
          createRecipeLog(options.userID, options.authorization, 'deleteRecipeIngredient', Number(relatedRecipeIngredients[i].recipeIngredientID), Number(relatedRecipeIngredients[i].recipeID), null, null, `deleted recipeIngredient ID: ${relatedRecipeIngredients[i].recipeIngredientID}`);
        }
      } catch (error) {
        global.logger.error(`Error deleting related recipeIngredients: ${error.message}`);
        throw errorGen(`Error deleting related recipeIngredients: ${error.message}`, 400);
      }

      //delete recipe
      const { error: deleteError } = await db.from('recipes').update({ deleted: true }).eq('recipeID', options.recipeID);

      if (deleteError) {
        global.logger.error(`Error deleting recipe: ${deleteError.message}`);
        throw errorGen(`Error deleting recipe: ${deleteError.message}`, 400);
      }

      //add a 'deleted' log entry
      createRecipeLog(options.userID, options.authorization, 'deleteRecipe', Number(options.recipeID), null, null, null, `deleted recipe: ${recipe[0].title}, ID: ${options.recipeID}`);
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function useRecipe(options) {
    const { recipeID, authorization, satisfaction, difficulty, note, checkIngredientStock } = options;
    //ensure provided satisfaction is valid number one through ten
    if (!satisfaction || satisfaction < 1 || satisfaction > 10) {
      global.logger.error(`Satisfaction should be integer between 1 and 10`);
      throw errorGen(`Satisfaction should be integer between 1 and 10`, 400);
    }

    //ensure provided difficulty is valid number one through ten
    if (!difficulty || difficulty < 1 || difficulty > 10) {
      global.logger.error(`Difficulty should be integer between 1 and 10`);
      throw errorGen(`Difficulty should be integer between 1 and 10`, 400);
    }

    //ensure provided recipeID exists
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error getting recipe details: ${error.message}`);
      throw errorGen(`Error getting recipe details while using recipe: ${error.message}`, 400);
    }
    if (!recipe.length) {
      global.logger.error(`Recipe with provided ID ${recipeID} does not exist`);
      throw errorGen(`Recipe with provided ID ${recipeID} does not exist`, 400);
    }

    if (checkIngredientStock) {
      //make call to supply service to check whether there is sufficient stock to make this recipe
      const { data: supplyCheckResult, error: supplyCheckError } = await supplyCheckRecipe(options.userID, authorization, recipeID);
      if (supplyCheckError) {
        global.logger.error(`Error checking supply for recipeID: ${recipeID} : ${supplyCheckError}`);
        throw errorGen(`Error checking supply for recipeID: ${recipeID}: ${supplyCheckError}`, 400);
      }
      if (supplyCheckResult.status === 'insufficient') {
        global.logger.error(`Insufficient stock to use recipeID: ${recipeID}. Need ${JSON.stringify(supplyCheckResult.insufficientIngredients)} ingredients and ${JSON.stringify(supplyCheckResult.insufficientTools)} tools`);
        throw errorGen(`Insufficient stock to make recipeID: ${recipeID}. Need ${JSON.stringify(supplyCheckResult.insufficientIngredients)} ingredients and ${JSON.stringify(supplyCheckResult.insufficientTools)} tools`, 400);
      }
    }

    try {
      //get list of related recipeComponents and use each
      // try {
      //   const { data: relatedRecipeComponents, error: componentError } = await db.from('recipeComponents').select().eq('recipeID', recipeID).eq('deleted', false);
      //   if (componentError) {
      //     global.logger.error(`Error getting related recipeComponents for recipe to use: ${recipeID} : ${componentError.message}`);
      //     throw errorGen(`Error getting related recipeComponents to use recipe: ${recipeID} : ${componentError.message}`, 400);
      //   }

      //   //use any associated recipeComponent entries;
      //   for (let i = 0; i < relatedRecipeComponents.length; i++) {
      //     const { data: recipeComponentUseResult } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/use/${relatedRecipeComponents[i].recipeComponentID}`, {
      //       authorization,
      //       userID: options.userID,
      //     });
      //     if (recipeComponentUseResult.error) {
      //       global.logger.error(`Error using recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} while using recipe ID: ${recipeID} : ${recipeComponentUseResult.error}`);
      //       throw errorGen(`Error using recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} while using recipe ID: ${recipeID} : ${recipeComponentUseResult.error}`, 400);
      //     }

      //     //add a 'used' log entry
      //     createRecipeLog(options.userID, authorization, 'useRecipeComponent', Number(relatedRecipeComponents[i].recipeComponentID), Number(relatedRecipeComponents[i].recipeID), null, null, `used recipeComponent: ${relatedRecipeComponents[i].title}`);
      //   }
      // } catch (error) {
      //   global.logger.error(`Error using related recipeComponents: ${error.message}`);
      //   throw errorGen(`Error using related recipeComponents: ${error.message}`, 400);
      // }

      if (checkIngredientStock) {
        //use stock of each recipeIngredient
        const useIngredientsResult = await useRecipeIngredients(options.userID, authorization, recipeID);
        if (useIngredientsResult.error) {
          global.logger.error(`'useRecipe' Error using recipeIngredients for recipeID: ${recipeID}. Rollback of inventory state was successful: ${useIngredientsResult.error.rollbackSuccess}`);
          throw errorGen(`Error using recipeIngredients for recipeID: ${recipeID}. Rollback of inventory state was successful: ${useIngredientsResult.error.rollbackSuccess}`, 400);
        }
      }

      //log use of recipe
      const { log, createLogError } = await createRecipeFeedbackLog(options.userID, authorization, Number(recipeID), recipe[0].title, String(satisfaction), String(difficulty), note);
      if (createLogError) {
        global.logger.error(`'useRecipe' Error logging recipe use: ${createLogError.message}`);
        throw errorGen(`Error logging recipe use: ${createLogError.message}`, 400);
      }
      //return the log entry
      return log;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function subscribeRecipe(options) {
    try {
      const { customID, sourceRecipeID, newRecipeID, userID } = options;

      //ensure provided sourceRecipeID exists and is not deleted
      const { data: sourceRecipe, error } = await db.from('recipes').select().eq('recipeID', sourceRecipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting sourceRecipe: ${error.message}`);
        throw errorGen(`Error getting sourceRecipe: ${error.message}`, 400);
      }
      if (!sourceRecipe.length) {
        global.logger.error(`Error subscribing to recipe. Recipe with provided ID (${sourceRecipeID}) does not exist`);
        throw errorGen(`Error subscribing to recipe. Recipe with provided ID (${sourceRecipeID}) does not exist`, 400);
      }
      if (sourceRecipe[0].userID === userID) {
        global.logger.error(`Error subscribing to recipe. Cannot subscribe to your own recipe`);
        throw errorGen(`Error subscribing to recipe. Cannot subscribe to your own recipe`, 400);
      }

      //ensure provided newRecipeID exists and is not deleted
      const { data: newRecipe, error: newRecipeError } = await db.from('recipes').select().eq('recipeID', newRecipeID).eq('deleted', false);
      if (newRecipeError) {
        global.logger.error(`Error getting newRecipe: ${newRecipeError.message}`);
        throw errorGen(`Error getting newRecipe: ${newRecipeError.message}`, 400);
      }
      if (!newRecipe.length) {
        global.logger.error(`Error subscribing to recipe. Recipe with provided ID (${newRecipeID}) does not exist`);
        throw errorGen(`Error subscribing to recipe. Recipe with provided ID (${newRecipeID}) does not exist`, 400);
      }

      //ensure provided sourceRecipeID is not the same as newRecipeID
      if (sourceRecipeID === newRecipeID) {
        global.logger.error(`Error subscribing to recipe. sourceRecipeID and newRecipeID cannot be the same`);
        throw errorGen(`Error subscribing to recipe. sourceRecipeID and newRecipeID cannot be the same`, 400);
      }

      //ensure provided sourceRecipeID is not already subscribed to newRecipeID
      const { data: existingSubscription, error: existingSubscriptionError } = await db.from('recipeSubscriptions').select('*').eq('sourceRecipeID', sourceRecipeID).eq('newRecipeID', newRecipeID);
      if (existingSubscriptionError) {
        global.logger.error(`Error getting existing subscription: ${existingSubscriptionError.message}`);
        throw errorGen(`Error getting existing subscription: ${existingSubscriptionError.message}`, 400);
      }
      const startDate = new Date();
      //if exists but deleted is true, undelete it and update startDate
      if (existingSubscription.length && existingSubscription[0].deleted) {
        try {
          const { data: updatedSubscription, error: undeleteError } = await db.from('recipeSubscriptions').update({ deleted: false, startDate }).eq('recipeSubscriptionID', existingSubscription[0].recipeSubscriptionID).single();
          if (undeleteError) {
            global.logger.error(`Error undeleting existing subscription: ${undeleteError.message}`);
            throw errorGen(`Error undeleting existing subscription: ${undeleteError.message}`, 400);
          }
          return updatedSubscription.subscriptionID;
        } catch (error) {
          global.logger.error(`Error undeleting existing subscription: ${error.message}`);
          throw errorGen(`Error undeleting existing subscription: ${error.message}`, 400);
        }
      } else if (existingSubscription.length) {
        global.logger.error(`Error subscribing to recipe. sourceRecipeID: ${sourceRecipeID} is already subscribed to newRecipeID: ${newRecipeID}`);
        throw errorGen(`Error subscribing to recipe. sourceRecipeID: ${sourceRecipeID} is already subscribed to newRecipeID: ${newRecipeID}`, 400);
      }

      //create subscription
      const { data: subscription, error: subscriptionError } = await db.from('recipeSubscriptions').insert({ userID, subscriptionID: customID, sourceRecipeID, newRecipeID, startDate }).select().single();
      if (subscriptionError) {
        global.logger.error(`Error creating subscription: ${subscriptionError.message}`);
        throw errorGen(`Error creating subscription: ${subscriptionError.message}`, 400);
      }
      return subscription.subscriptionID;
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
    }
  }

  async function deleteRecipeSubscription(options) {
    try {
      const { subscriptionID, authorization, userID } = options;

      //ensure provided subscriptionID exists and is not deleted
      const { data: subscription, error } = await db.from('recipeSubscriptions').select().eq('subscriptionID', subscriptionID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting subscription: ${error.message}`);
        throw errorGen(`Error getting subscription: ${error.message}`, 400);
      }
      if (!subscription.length) {
        global.logger.error(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not exist`);
        throw errorGen(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not exist`, 400);
      }
      if (subscription[0].userID !== userID) {
        global.logger.error(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not belong to user`);
        throw errorGen(`Error deleting subscription. Subscription with provided ID (${subscriptionID}) does not belong to user`);
      }

      //delete subscription
      const { error: deleteError } = await db.from('recipeSubscriptions').update({ deleted: true }).eq('subscriptionID', subscriptionID);
      if (deleteError) {
        global.logger.error(`Error deleting subscription: ${deleteError.message}`);
        throw errorGen(`Error deleting subscription: ${deleteError.message}`, 400);
      }

      //make axios call to delete recipe
      try {
        const { data: deleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${subscription[0].newRecipeID}`, { headers: { authorization } });
        if (deleteResult.error) {
          global.logger.error(`Error deleting recipe: ${deleteResult.error}`);
          throw errorGen(`Error deleting recipe: ${deleteResult.error}`, 400);
        }
      } catch (error) {
        global.logger.error(`Error deleting recipe: ${error.message}`);
        throw errorGen(`Error deleting recipe: ${error.message}`, 400);
      }
    } catch (error) {
      global.logger.error(`Unhandled Error: ${error.message}`);
      throw errorGen(`Unhandled Error: ${error.message}`, 400);
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
  };
};
