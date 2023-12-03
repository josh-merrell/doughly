('use strict');

const { default: axios } = require('axios');
const { createRecipeLog, createRecipeFeedbackLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { supplyCheckRecipe, useRecipeIngredients } = require('../../services/supply');

module.exports = ({ db }) => {
  async function construct(options) {
    const { customID, recipeCategoryID, authorization, userID, title, servings, lifespanDays, type, timePrep, timeBake, photoURL, components, ingredients, tools, steps } = options;

    console.log();
    let recipeID;
    const createdItems = [];
    try {
      //first create the recipe, save as {'recipeID': recipeID} to createdItems
      console.log(`creating recipe. path: ${process.env.NODE_HOST}:${process.env.PORT}/recipes`);
      const { data: recipe, error } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/recipes`,
        {
          authorization,
          userID,
          title,
          servings,
          lifespanDays,
          type: 'subscription',
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

      const ingredientPromises = ingredients.map((i) => constructRecipeIngredient(i, authorization, userID, recipe.recipeID));
      const ingredientResults = await Promise.allSettled(ingredientPromises);
      for (const result of ingredientResults) {
        if (result.status === 'fulfilled') {
          createdItems.push({ ingredientID: result.value.ingredientID });
        } else {
          throw new Error(`Failed when creating recipeIngredients. Rolled-back. Failure: ${result.reason}`);
        }
      }
      console.log('created ingredients');

      if (!tools.length) {
        // dummy recipeTool case
        constructRecipeTool({ quantity: -1 }, authorization, userID, recipe.recipeID);
      } else {
        const toolPromises = tools.map((t) => constructRecipeTool(t, authorization, userID, recipe.recipeID));
        const toolResults = await Promise.allSettled(toolPromises);
        for (const result of toolResults) {
          if (result.status === 'fulfilled') {
            createdItems.push({ toolID: result.value.toolID });
          } else {
            throw new Error(`Failed when creating recipeTools. Rolled-back. Failure: ${result.reason}`);
          }
        }
        console.log('created tools');
      }

      const stepPromises = steps.map((s) => constructRecipeStep(s, authorization, userID, recipe.recipeID));
      const stepResults = await Promise.allSettled(stepPromises);
      for (const result of stepResults) {
        if (result.status === 'fulfilled') {
          createdItems.push({ stepID: result.value.stepID });
        } else {
          throw new Error(`Failed when creating recipeSteps. Rolled-back. Failure: ${result.reason}`);
        }
      }
      console.log('created steps');

      return { recipeID: recipe.recipeID };
    } catch (error) {
      //rollback any created recipe items (the API endpoint will delete associated recipeIngredients, recipeTools, and recipeSteps)
      if (recipeID) {
        await deleteItem({ recipeID: recipeID }, authorization);
        for (let i in createdItems) {
          deleteItem(createdItems[i], authorization);
        }
      }
      throw new Error(`Failed to construct Recipe. ${error.message}`);
    }
  }

  async function constructRecipeIngredient(ingredient, authorization, userID, recipeID) {
    let ingredientID;
    try {
      if ( ingredient.ingredientID === 0) {
        // If ingredientID is not provided, create a new ingredient
        const { data } = await axios.post(
          `${process.env.NODE_HOST}:${process.env.PORT}/ingredients`,
          {
            authorization,
            userID,
            IDtype: 12,
            name: ingredient.name,
            lifespanDays: ingredient.lifespanDays,
            purchaseUnit: ingredient.purchaseUnit,
            gramRatio: ingredient.gramRatio,
            brand: ingredient.brand,
          },
          { headers: { authorization } },
        );
        ingredientID = data.ingredientID;
      } else {
        ingredientID = ingredient.ingredientID;
      }
    } catch (error) {
      throw error;
    }
    // Then, create the recipeIngredient
    try {
      const { data } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe`,
        {
          authorization,
          userID,
          IDtype: 16,
          recipeID,
          ingredientID,
          measurementUnit: ingredient.measurementUnit,
          measurement: ingredient.measurement,
          purchaseUnitRatio: ingredient.purchaseUnitRatio,
        },
        { headers: { authorization } },
      );
      return { recipeIngredientID: data.recipeIngredientID, ingredientID: ingredientID };
    } catch (error) {
      if (ingredientID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/${ingredientID}`, {
          headers: {
            authorization,
          },
        });
      }
      throw error;
    }
  }

  async function constructRecipeTool(tool, authorization, userID, recipeID) {
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
        return { recipeToolID: data.recipeToolID, toolID: toolID };
      } 
      
      if (tool.toolID === 0) {
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
        toolID = data.toolID;
      } else {
        toolID = tool.toolID;
      }
    } catch (error) {
      throw error;
    }
    // Then, create the recipeTool
    try {
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
      if (toolID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/tools/${toolID}`, {
          headers: {
            authorization,
          },
        });
      }
      throw error;
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
      throw error;
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
      const { data } = await axios.post(
        `${process.env.NODE_HOST}:${process.env.PORT}/steps/recipe`,
        body,
        { headers: { authorization } },
      );
      return { recipeStepID: data.recipeStepID, stepID: stepID };
    } catch (error) {
      if (stepID) {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/steps/${stepID}`, {
          headers: {
            authorization,
          },
        });
      }
      throw error;
    }
  }

  async function deleteItem(item, authorization) {
    if (item.recipeID) {
      await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/${item.recipeID}`, {
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
      global.logger.info(`Error getting recipes: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipes.length} recipes`);
    return recipes;
  }

  async function getByID(options) {
    const { recipeID } = options;
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipe: ${recipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipe`);
    return recipe;
  }

  async function getRecipeIngredients(options) {
    const { recipeID } = options;
    const { data: recipeIngredients, error } = await db.from('recipeIngredients').select().eq('recipeID', recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeIngredients for recipeID: ${recipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeIngredients.length} recipeIngredients for recipeID: ${recipeID}`);
    return recipeIngredients;
  }

  async function getRecipeTools(options) {
    const { recipeID } = options;
    const { data: recipeTools, error } = await db.from('recipeTools').select().eq('recipeID', recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeTools for recipeID: ${recipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeTools.length} recipeTools for recipeID: ${recipeID}`);
    return recipeTools;
  }

  async function getRecipeSteps(options) {
    const { recipeID } = options;
    const { data: recipeSteps, error } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeSteps for recipeID: ${recipeID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeSteps.length} recipeSteps for recipeID: ${recipeID}`);
    return recipeSteps;
  }

  async function create(options) {
    const { customID, authorization, userID, title, servings, lifespanDays, recipeCategoryID, timePrep, timeBake, photoURL, type } = options;
    const status = 'noIngredients';
    console.log(
      `creating recipe. customID: ${customID} authorization: ${authorization}, userID: ${userID}, title: ${title}, servings: ${servings}, lifespanDays: ${lifespanDays}, type: ${type}, timePrep: ${timePrep}, timeBake: ${timeBake}, photoURL: ${photoURL}, recipeCategoryID: ${recipeCategoryID}`,
    );

    if (!title) {
      global.logger.info(`Title is required`);
      return { error: `Title is required` };
    }
    if (!servings || servings < 0) {
      global.logger.info(`positive Servings integer is required`);
      return { error: `positive Servings integer is required` };
    }
    if (!lifespanDays || lifespanDays < 0) {
      global.logger.info(`positive LifespanDays integer is required`);
      return { error: `positive LifespanDays integer is required` };
    }
    if (!timePrep || timePrep < 0) {
      global.logger.info(`positive TimePrep integer is required`);
      return { error: `positive TimePrep integer is required` };
    }
    if (timeBake && timeBake < 1) {
      global.logger.info(`positive TimeBake integer is required`);
      return { error: `positive TimeBake integer is required` };
    }

    //verify that the provided recipeCategoryID exists, return error if not
    if (recipeCategoryID) {
      const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
      if (error) {
        global.logger.info(`Error getting recipeCategory: ${error.message}`);
        return { error: error.message };
      }
      if (!recipeCategory.length) {
        global.logger.info(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
        return { error: `Provided RecipeCategory ID:(${recipeCategoryID}) does not exist` };
      }
    }

    //create recipe
    const { data: recipe, error } = await db.from('recipes').insert({ recipeID: customID, userID, title, servings, lifespanDays, recipeCategoryID, status, timePrep, timeBake, photoURL, version: 1, type }).select().single();

    if (error) {
      global.logger.info(`Error creating recipe: ${error.message}`);
      return { error: error.message };
    }

    //add a 'created' log entry
    createRecipeLog(userID, authorization, 'createRecipe', recipe.recipeID, null, null, null, `created recipe ${recipe.title}, ID: ${recipe.recipeID}`);

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
  }

  async function update(options) {
    const { recipeID, authorization, recipeCategoryID, timePrep, timeBake } = options;
    //verify that the provided recipeID exists, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);

    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with provided ID (${recipeID}) does not exist`);
      return { error: `Recipe with provided ID (${recipeID}) does not exist` };
    }

    //verify that the provided recipeCategoryID exists, return error if not
    if (recipeCategoryID) {
      const { data: recipeCategory, error } = await db.from('recipeCategories').select().eq('recipeCategoryID', recipeCategoryID);
      if (error) {
        global.logger.info(`Error getting recipeCategory: ${error.message}`);
        return { error: error.message };
      }
      if (!recipeCategory.length) {
        global.logger.info(`Provided RecipeCategory ID:(${recipeCategoryID}) does not exist`);
        return { error: `Provided RecipeCategory ID:(${recipeCategoryID}) does not exist` };
      }
    }

    //verify that servings, lifespanDays, timePrep, and timeBake are positive integers, if provided. Return error if not
    if (options.servings && options.servings < 1) {
      global.logger.info(`Servings should be positive integer`);
      return { error: `Servings should be positive integer` };
    }
    if (options.lifespanDays && options.lifespanDays < 1) {
      global.logger.info(`LifespanDays should be positive integer`);
      return { error: `LifespanDays should be positive integer` };
    }
    if (timePrep && timePrep < 1) {
      global.logger.info(`TimePrep should be positive integer`);
      return { error: `TimePrep should be positive integer` };
    }
    if (timeBake && timeBake < 1) {
      global.logger.info(`TimeBake should be positive integer`);
      return { error: `TimeBake should be positive integer` };
    }

    const updateFields = {};
    if (options.status) {
      //ensure provided status is valid value
      if (options.status !== 'noIngredients' && options.status !== 'noTools' && options.status !== 'noSteps' && options.status !== 'published') {
        global.logger.info(`Invalid status`);
        return { error: `Invalid status` };
      }
    }
    for (let key in options) {
      if (key !== 'recipeID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedRecipe = await updater(options.userID, authorization, 'recipeID', recipeID, 'recipes', updateFields);
      return updatedRecipe;
    } catch (error) {
      global.logger.info(`Error updating recipe: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteRecipe(options) {
    //verify that the provided recipeID exists, return error if not
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', options.recipeID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with provided ID (${options.recipeID}) does not exist`);
      return { error: `Recipe with provided ID (${options.recipeID}) does not exist` };
    }

    //if recipe has photoURL, delete photo from s3
    if (recipe[0].photoURL) {
      try {
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/uploads/image`, { data: { userID: options.userID, photoURL: recipe[0].photoURL, type: 'recipe', id: options.recipeID }, headers: { authorization: options.authorization } });
        global.logger.info(`Deleted photo for recipeID ${options.recipeID}`);
      } catch (error) {
        global.logger.info(`Error deleting recipe photo: ${error.message}`);
        return { error: error.message };
      }
    }

    //get list of related recipeComponents
    try {
      const { data: relatedRecipeComponents, error: componentError } = await db.from('recipeComponents').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (componentError) {
        global.logger.info(`Error getting related recipeComponents for recipe to delete: ${options.recipeID} : ${componentError.message}`);
        return { error: componentError.message };
      }

      //delete any associated recipeComponent entries;
      for (let i = 0; i < relatedRecipeComponents.length; i++) {
        const { data: recipeComponentDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeComponents/${relatedRecipeComponents[i].recipeComponentID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeComponentDeleteResult.error) {
          global.logger.info(`Error deleting recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} prior to deleting recipe ID: ${options.recipeID} : ${recipeComponentDeleteResult.error}`);
          return { error: recipeComponentDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(options.userID, options.authorization, 'deleteRecipeComponent', Number(relatedRecipeComponents[i].recipeComponentID), Number(relatedRecipeComponents[i].recipeID), null, null, `deleted recipeComponent ID: ${relatedRecipeComponents[i].recipeComponentID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeComponents: ${error.message}`);
      return { error: error.message };
    }

    //get list of related recipeSteps
    try {
      const { data: relatedRecipeSteps, error: stepError } = await db.from('recipeSteps').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (stepError) {
        global.logger.info(`Error getting related recipeSteps for recipe to delete: ${options.recipeID} : ${stepError.message}`);
        return { error: stepError.message };
      }

      //delete any associated recipeSteps entries;
      for (let i = 0; i < relatedRecipeSteps.length; i++) {
        const { data: recipeStepDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/steps/recipe/${relatedRecipeSteps[i].recipeStepID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeStepDeleteResult.error) {
          global.logger.info(`Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting recipe ID: ${options.recipeID} : ${recipeStepDeleteResult.error}`);
          return { error: recipeStepDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(options.userID, options.authorization, 'deleteRecipeStep', Number(relatedRecipeSteps[i].recipeStepID), Number(relatedRecipeSteps[i].recipeID), null, null, `deleted recipeStep ID: ${relatedRecipeSteps[i].recipeStepID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeSteps: ${error.message}`);
      return { error: error.message };
    }

    //get list of related recipeTools
    try {
      const { data: relatedRecipeTools, error: toolError } = await db.from('recipeTools').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (toolError) {
        global.logger.info(`Error getting related recipeTools for recipe to delete: ${options.recipeID} : ${toolError.message}`);
        return { error: toolError.message };
      }

      //delete any associated recipeTools entries;
      for (let i = 0; i < relatedRecipeTools.length; i++) {
        const { data: recipeToolDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/tools/recipe/${relatedRecipeTools[i].recipeToolID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeToolDeleteResult.error) {
          global.logger.info(`Error deleting recipeToolID: ${relatedRecipeTools[i].recipeToolID} prior to deleting recipe ID: ${options.recipeID} : ${recipeToolDeleteResult.error}`);
          return { error: recipeToolDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(options.userID, options.authorization, 'deleteRecipeTool', Number(relatedRecipeTools[i].recipeToolID), Number(relatedRecipeTools[i].recipeID), null, null, `deleted recipeTool ID: ${relatedRecipeTools[i].recipeToolID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeTools: ${error.message}`);
      return { error: error.message };
    }

    //get list of related recipeIngredients
    try {
      const { data: relatedRecipeIngredients, error: ingredientError } = await db.from('recipeIngredients').select().eq('recipeID', options.recipeID).eq('deleted', false);
      if (ingredientError) {
        global.logger.info(`Error getting related recipeIngredients for recipe to delete: ${options.recipeID} : ${ingredientError.message}`);
        return { error: ingredientError.message };
      }

      //delete any associated recipeIngredients entries;
      for (let i = 0; i < relatedRecipeIngredients.length; i++) {
        const { data: recipeIngredientDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/ingredients/recipe/${relatedRecipeIngredients[i].recipeIngredientID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeIngredientDeleteResult.error) {
          global.logger.info(`Error deleting recipeIngredientID: ${relatedRecipeIngredients[i].recipeIngredientID} prior to deleting recipe ID: ${options.recipeID} : ${recipeIngredientDeleteResult.error}`);
          return { error: recipeIngredientDeleteResult.error };
        }

        //add a 'deleted' log entry
        createRecipeLog(options.userID, options.authorization, 'deleteRecipeIngredient', Number(relatedRecipeIngredients[i].recipeIngredientID), Number(relatedRecipeIngredients[i].recipeID), null, null, `deleted recipeIngredient ID: ${relatedRecipeIngredients[i].recipeIngredientID}`);
      }
    } catch (error) {
      global.logger.info(`Error deleting related recipeIngredients: ${error.message}`);
      return { error: error.message };
    }

    //delete recipe
    const { error: deleteError } = await db.from('recipes').update({ deleted: true }).eq('recipeID', options.recipeID);

    if (deleteError) {
      global.logger.info(`Error deleting recipe: ${deleteError.message}`);
      return { error: deleteError.message };
    }

    //add a 'deleted' log entry
    createRecipeLog(options.userID, options.authorization, 'deleteRecipe', Number(options.recipeID), null, null, null, `deleted recipe: ${recipe[0].title}, ID: ${options.recipeID}`);
  }

  async function useRecipe(options) {
    const { recipeID, authorization, satisfaction, difficulty, note } = options;
    //ensure provided satisfaction is valid number one through ten
    if (!satisfaction || satisfaction < 1 || satisfaction > 10) {
      global.logger.info(`Satisfaction should be integer between 1 and 10`);
      return { error: `Satisfaction should be integer between 1 and 10` };
    }

    //ensure provided difficulty is valid number one through ten
    if (!difficulty || difficulty < 1 || difficulty > 10) {
      global.logger.info(`Difficulty should be integer between 1 and 10`);
      return { error: `Difficulty should be integer between 1 and 10` };
    }

    //ensure provided recipeID exists
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error getting recipe: ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`Error using recipe. Recipe with provided ID (${recipeID}) does not exist`);
      return { error: `Error using recipe. Recipe with provided ID (${recipeID}) does not exist` };
    }

    //make call to supply service to check whether there is sufficient stock to make this recipe
    const { data: supplyCheckResult, error: supplyCheckError } = await supplyCheckRecipe(options.userID, authorization, recipeID);
    if (supplyCheckError) {
      global.logger.info(`Error checking supply for recipeID: ${recipeID} : ${supplyCheckError.message}`);
      return { error: supplyCheckError.message };
    }
    if (supplyCheckResult.status === 'insufficient') {
      global.logger.info(`Insufficient stock to make recipeID: ${recipeID}. Need ${JSON.stringify(supplyCheckResult.insufficientIngredients)} ingredients and ${JSON.stringify(supplyCheckResult.insufficientTools)} tools`);
      return {
        error: `Insufficient stock to make recipeID: ${recipeID}. Need ${JSON.stringify(supplyCheckResult.insufficientIngredients)} ingredients and ${JSON.stringify(supplyCheckResult.insufficientTools)} tools`,
        shoppingList: { ingredients: supplyCheckResult.insufficientIngredients, tools: supplyCheckResult.insufficientTools },
      };
    }

    //get list of related recipeComponents and use each
    try {
      const { data: relatedRecipeComponents, error: componentError } = await db.from('recipeComponents').select().eq('recipeID', recipeID).eq('deleted', false);
      if (componentError) {
        global.logger.info(`Error getting related recipeComponents for recipe to use: ${recipeID} : ${componentError.message}`);
        return { error: componentError.message };
      }

      //use any associated recipeComponent entries;
      for (let i = 0; i < relatedRecipeComponents.length; i++) {
        const { data: recipeComponentUseResult } = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/recipes/use/${relatedRecipeComponents[i].recipeComponentID}`, {
          authorization,
          userID: options.userID,
        });
        if (recipeComponentUseResult.error) {
          global.logger.info(`Error using recipeComponentID: ${relatedRecipeComponents[i].recipeComponentID} prior to using recipe ID: ${recipeID} : ${recipeComponentUseResult.error}`);
          return { error: recipeComponentUseResult.error };
        }

        //add a 'used' log entry
        createRecipeLog(options.userID, authorization, 'useRecipeComponent', Number(relatedRecipeComponents[i].recipeComponentID), Number(relatedRecipeComponents[i].recipeID), null, null, `used recipeComponent: ${relatedRecipeComponents[i].title}`);
      }
    } catch (error) {
      global.logger.info(`Error using related recipeComponents: ${error.message}`);
      return { error: error.message };
    }

    //use stock of each recipeIngredient
    const useIngredientsResult = await useRecipeIngredients(options.userID, authorization, recipeID);
    if (useIngredientsResult.error) {
      global.logger.info(`Error using recipeIngredients for recipeID: ${recipeID} :. Rollback of inventory state was successful: ${useIngredientsResult.error.rollbackSuccess}`);
      return { error: useIngredientsResult.error.message };
    }

    //log use of recipe
    const { log, createLogError } = await createRecipeFeedbackLog(options.userID, authorization, Number(recipeID), String(satisfaction), String(difficulty), note);
    if (createLogError) {
      global.logger.info(`Error logging recipe use: ${createLogError.message}`);
      return { error: createLogError.message };
    }
    //return the log entry
    return log;
  }

  async function subscribeRecipe(options) {
    const { customID, sourceRecipeID, newRecipeID, authorization, userID } = options;

    //ensure provided sourceRecipeID exists and is not deleted
    const { data: sourceRecipe, error } = await db.from('recipes').select().eq('recipeID', sourceRecipeID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error getting sourceRecipe: ${error.message}`);
      return { error: error.message };
    }
    if (!sourceRecipe.length) {
      global.logger.info(`Error subscribing to recipe. Recipe with provided ID (${sourceRecipeID}) does not exist`);
      return { error: `Error subscribing to recipe. Recipe with provided ID (${sourceRecipeID}) does not exist` };
    }
    if (sourceRecipe[0].userID === userID) {
      global.logger.info(`Error subscribing to recipe. Cannot subscribe to your own recipe`);
      return { error: `Error subscribing to recipe. Cannot subscribe to your own recipe` };
    }

    //ensure provided newRecipeID exists and is not deleted
    const { data: newRecipe, error: newRecipeError } = await db.from('recipes').select().eq('recipeID', newRecipeID).eq('deleted', false);
    if (newRecipeError) {
      global.logger.info(`Error getting newRecipe: ${newRecipeError.message}`);
      return { error: newRecipeError.message };
    }
    if (!newRecipe.length) {
      global.logger.info(`Error subscribing to recipe. Recipe with provided ID (${newRecipeID}) does not exist`);
      return { error: `Error subscribing to recipe. Recipe with provided ID (${newRecipeID}) does not exist` };
    }

    //ensure provided sourceRecipeID is not the same as newRecipeID
    if (sourceRecipeID === newRecipeID) {
      global.logger.info(`Error subscribing to recipe. sourceRecipeID and newRecipeID cannot be the same`);
      return { error: `Error subscribing to recipe. sourceRecipeID and newRecipeID cannot be the same` };
    }

    //ensure provided sourceRecipeID is not already subscribed to newRecipeID
    const { data: existingSubscription, error: existingSubscriptionError } = await db.from('recipeSubscriptions').select('*').eq('sourceRecipeID', sourceRecipeID).eq('newRecipeID', newRecipeID);
    if (existingSubscriptionError) {
      global.logger.info(`Error getting existing subscription: ${existingSubscriptionError.message}`);
      return { error: existingSubscriptionError.message };
    }
    const startDate = new Date();
    //if exists but deleted is true, undelete it and update startDate
    if (existingSubscription.length && existingSubscription[0].deleted) {
      try {
        const { data: updatedSubscription, error: undeleteError } = await db.from('recipeSubscriptions').update({ deleted: false, startDate }).eq('recipeSubscriptionID', existingSubscription[0].recipeSubscriptionID).single();
        if (undeleteError) {
          global.logger.info(`Error undeleting existing subscription: ${undeleteError.message}`);
          return { error: undeleteError.message };
        }
        return updatedSubscription.subscriptionID;
      } catch (error) {
        global.logger.info(`Error undeleting existing subscription: ${error.message}`);
        return { error: error.message };
      }
    } else if (existingSubscription.length) {
      global.logger.info(`Error subscribing to recipe. sourceRecipeID: ${sourceRecipeID} is already subscribed to newRecipeID: ${newRecipeID}`);
      return { error: `Error subscribing to recipe. sourceRecipeID: ${sourceRecipeID} is already subscribed to newRecipeID: ${newRecipeID}` };
    }

    //create subscription
    const { data: subscription, error: subscriptionError } = await db.from('recipeSubscriptions').insert({ userID, subscriptionID: customID, sourceRecipeID, newRecipeID, startDate }).select().single();
    if (subscriptionError) {
      global.logger.info(`Error creating subscription: ${subscriptionError.message}`);
      return { error: subscriptionError.message };
    }
    return subscription.subscriptionID;
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
      ingredients: getRecipeIngredients,
      tools: getRecipeTools,
      steps: getRecipeSteps,
    },
    construct,
    create,
    update,
    delete: deleteRecipe,
    use: useRecipe,
    subscribe: subscribeRecipe,
  };
};
