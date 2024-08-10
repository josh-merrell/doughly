('use strict');

const axios = require('axios');
const { createRecipeLog } = require('../../services/dbLogger');
const { updater } = require('../../db');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, stepIDs, title } = options;

    try {
      let q = db.from('steps').select().filter('userID', 'eq', userID).eq('deleted', false).order('stepID', { ascending: true });

      if (stepIDs) {
        q = q.in('stepID', stepIDs);
      }
      if (title) {
        q = q.like('title', title);
      }

      const { data: steps, error } = await q;

      if (error) {
        throw errorGen(`*steps-getAll* Error getting steps: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*steps-getAll* Got ${steps.length} steps`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return steps;
    } catch (err) {
      throw errorGen(err.message || '*steps-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_steps-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getStepByID(options) {
    try {
      const { data, error } = await db.from('steps').select().eq('stepID', options.stepID).eq('deleted', false).single();
      if (error) {
        throw errorGen(`*steps-getStepByID* Error getting step by ID: ${options.stepID}:${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      return data;
    } catch (err) {
      throw errorGen(err.message || '*steps-getStepByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_steps-getStepByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { authorization, customID, userID, title, description } = options;

    try {
      //if step with provided title exists but is deleted, undelete it, reset versioning and return it
      const { data: deletedSteps, error: error3 } = await db.from('steps').select().eq('title', title).eq('deleted', true);
      if (error3) {
        throw errorGen(`*steps-create* Error validating title: ${title} while creating step ${error3.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (deletedSteps.length > 0) {
        const { error: error4 } = await db.from('steps').update({ deleted: false, version: 1 }).eq('stepID', deletedSteps[0].stepID).single();
        if (error4) {
          throw errorGen(`*steps-create* Error undeleting step: ${error4.message}`, 513, 'failSupabaseUpdate', true, 3);
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
        throw errorGen(`*steps-create* Error creating step: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      createRecipeLog(userID, authorization, 'createdStep', data.stepID, null, null, null, `created step: ${data.title}`);
      return {
        stepID: data.stepID,
        title: data.title,
        description: data.description,
        version: 1,
      };
    } catch (err) {
      throw errorGen(err.message || '*steps-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_steps-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { authorization, stepID, title, description } = options;

    try {
      //verify that provided stepID exists
      const { data: step, error } = await db.from('steps').select().eq('stepID', stepID);
      if (error) {
        throw errorGen(`*steps-update* Error validating step ID: ${stepID} while updating step ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!step.length) {
        throw errorGen(`*steps-update* Error validating step ID: ${stepID} while updating step`, 515, 'cannotComplete', false, 3);
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
      const updatedStep = await updater(options.userID, authorization, 'stepID', options.stepID, 'steps', updateFields);
      return updatedStep;
    } catch (err) {
      throw errorGen(err.message || '*steps-update* Unhandled Error', err.code || 520, err.name || 'unhandledError_steps-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteStep(options) {
    const { stepID, userID, authorization } = options;

    try {
      //verify that provided stepID exists
      const { data: step, error } = await db.from('steps').select().eq('stepID', stepID).eq('deleted', false);
      if (error) {
        throw errorGen(`*steps-deleteStep* Error validating step ID: ${stepID} while deleting step ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!step.length) {
        throw errorGen(`*steps-deleteStep* Provided step ID: ${stepID} does not exist, can't delete`, 515, 'cannotComplete', false, 3);
      }

      //get list of related recipeSteps
      const { data: relatedRecipeSteps, error: stepError } = await db.from('recipeSteps').select().eq('stepID', stepID).eq('deleted', false);
      if (stepError) {
        throw errorGen(`*steps-deleteStep* Error getting related recipeSteps for step to delete: ${stepID} : ${stepError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      //delete any associated recipeSteps entries. The version update to the recipe will be handled by the DEL /recipeSteps/:recipeStepID endpoint
      for (let i = 0; i < relatedRecipeSteps.length; i++) {
        const { data: recipeStepDeleteResult } = await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/recipeSteps/${relatedRecipeSteps[i].recipeStepID}`, {
          headers: {
            authorization: options.authorization,
          },
        });
        if (recipeStepDeleteResult.error) {
          throw errorGen(`*steps-deleteStep* Error deleting recipeStepID: ${relatedRecipeSteps[i].recipeStepID} prior to deleting step ID: ${stepID} : ${recipeStepDeleteResult.error}`, 514, 'failSupabaseDelete', true, 3);
        }
      }

      //delete step
      const { data, error: deleteError } = await db.from('steps').update({ deleted: true }).eq('stepID', stepID);
      if (deleteError) {
        throw errorGen(`*steps-deleteStep* Error deleting step: ${deleteError.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      createRecipeLog(userID, authorization, 'deleteStep', Number(stepID), null, null, null, `deleted step: ${step[0].title}`);
      return data;
    } catch (err) {
      throw errorGen(err.message || '*steps-deleteStep* Unhandled Error', err.code || 520, err.name || 'unhandledError_steps-deleteStep', err.isOperational || false, err.severity || 2);
    }
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
