('use strict');

const axios = require('axios');
const { createRecipeLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, stepIDs, title } = options;

    let q = db.from('steps').select().filter('userID', 'eq', userID).eq('deleted', false).order('stepID', { ascending: true });

    if (stepIDs) {
      q = q.in('stepID', stepIDs);
    }
    if (title) {
      q = q.like('title', title);
    }

    const { data: steps, error } = await q;

    if (error) {
      global.logger.error(`Error getting steps: ${error.message}`);
      throw errorGen('Error getting steps', 400);
    }
    global.logger.info(`Got ${steps.length} steps`);
    return steps;
  }

  async function getStepByID(options) {
    const { data, error } = await db.from('steps').select().eq('stepID', options.stepID).eq('deleted', false).single();
    if (error) {
      global.logger.error(`Error getting step by ID: ${options.stepID}:${error.message}`);
      throw errorGen(`Error getting step by ID: ${options.stepID}`, 400);
    }
    return data;
  }

  async function create(options) {
    const { authorization, customID, userID, title, description } = options;

    //if step with provided title exists but is deleted, undelete it, reset versioning and return it
    const { data: deletedSteps, error: error3 } = await db.from('steps').select().eq('title', title).eq('deleted', true);
    if (error3) {
      global.logger.error(`Error validating title: ${title} while creating step ${error3.message}`);
      throw errorGen(`Error validating title: ${title} while creating step`, 400);
    }
    if (deletedSteps.length > 0) {
      const { error: error4 } = await db.from('steps').update({ deleted: false, version: 1 }).eq('stepID', deletedSteps[0].stepID).single();
      if (error4) {
        global.logger.error(`Error undeleting step: ${error4.message}`);
        throw errorGen(`Error undeleting step: ${error4.message}`, 400);
      }
      await createRecipeLog(userID, authorization, 'createStep', deletedSteps[0].stepID, null, null, null, `created step: ${deletedSteps[0].title}`);
      return {
        stepID: deletedSteps[0].stepID,
        title: deletedSteps[0].title,
        description: deletedSteps[0].description,
        version: 1,
      };
    }

    const { data, error } = await db.from('steps').insert({ stepID: customID, userID, title, description, version: 1 }).select().single();
    if (error) {
      global.logger.error(`Error creating step: ${error.message}`);
      throw errorGen(`Error creating step: ${error.message}`, 400);
    }
    createRecipeLog(userID, authorization, 'createdStep', data.stepID, null, null, null, `created step: ${data.title}`);
    return {
      stepID: data.stepID,
      title: data.title,
      description: data.description,
      version: 1,
    };
  }

  async function update(options) {
    const { authorization, stepID, title, description } = options;
    //verify that provided stepID exists
    const { data: step, error } = await db.from('steps').select().eq('stepID', stepID);
    if (error) {
      global.logger.error(`Error validating step ID: ${stepID} while updating step ${error.message}`);
      throw errorGen(`Error validating step ID: ${stepID} while updating step`, 400);
    }
    if (!step.length) {
      global.logger.error(`Error validating step ID: ${stepID} while updating step`);
      throw errorGen(`Error validating step ID: ${stepID} while updating step`, 400);
    }

    if (!title || !description) {
      // nothing to update, just return existing step
      return step[0];
    }

    const updateFields = {};
    for (let key in options) {
      if (key !== 'stepID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedStep = await updater(options.userID, authorization, 'stepID', options.stepID, 'steps', updateFields);
      return updatedStep;
    } catch (err) {
      global.logger.error(`Error updating step: ${err.message}`);
      throw errorGen(`Error updating step: ${err.message}`, 400);
    }
  }

  async function deleteStep(options) {
    const { stepID, userID, authorization } = options;
    //verify that provided stepID exists
    const { data: step, error } = await db.from('steps').select().eq('stepID', stepID).eq('deleted', false);
    if (error) {
      global.logger.error(`Error validating step ID: ${stepID} while deleting step ${error.message}`);
      throw errorGen(`Error validating step ID: ${stepID} while deleting step`, 400);
    }
    if (!step.length) {
      global.logger.error(`Provided step ID: ${stepID} does not exist, can't delete`);
      throw errorGen(`Provided step ID: ${stepID} does not exist, can't delete`, 400);
    }

    //get list of related recipeSteps
    try {
      const { data: relatedRecipeSteps, error: stepError } = await db.from('recipeSteps').select().eq('stepID', stepID).eq('deleted', false);
      if (stepError) {
        global.logger.error(`Error getting related recipeSteps for step to delete: ${stepID} : ${stepError.message}`);
        throw errorGen(`Error getting related recipeSteps for step to delete: ${stepID}`, 400);
      }

      //delete any associated recipeSteps entries. The version update to the recipe will be handled by the DEL /recipeSteps/:recipeStepID endpoint
      for (let i = 0; i < relatedRecipeSteps.length; i++) {
        const { data: recipeStepDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeSteps/${relatedRecipeSteps[i].recipeStepID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeStepDeleteResult.error) {
          global.logger.error(`Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting step ID: ${stepID} : ${recipeStepDeleteResult.error}`);
          throw errorGen(`Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting step ID: ${stepID}`, 400);
        }
      }
    } catch (error) {
      global.logger.error(`Error deleting related recipeSteps: ${error.message}`);
      throw errorGen(`Error deleting related recipeSteps: ${error.message}`, 400);
    }

    //delete step
    const { data, error: deleteError } = await db.from('steps').update({ deleted: true }).eq('stepID', stepID);
    if (deleteError) {
      global.logger.error(`Error deleting step: ${deleteError.message}`);
      throw errorGen(`Error deleting step: ${deleteError.message}`, 400);
    }
    createRecipeLog(userID, authorization, 'deleteStep', Number(stepID), null, null, null, `deleted step: ${step[0].title}`);
    return data;
  }

  return {
    get: {
      all: getAll,
      byID: getStepByID,
    },
    create,
    update,
    delete: deleteStep,
  };
};
