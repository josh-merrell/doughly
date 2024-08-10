const axios = require('axios');

('use strict');
const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  const sequenceShifter = async (userID, authorization, recipeStepID, newSeq) => {
    try {
      await updater(userID, authorization, 'recipeStepID', recipeStepID, 'recipeSteps', { sequence: newSeq });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps sequenceShifter', err.code || 520, err.name || 'unhandledError_recipeSteps-sequenceShifter', err.isOperational || false, err.severity || 2);
    }
  };

  async function getAll(options) {
    const { userID, recipeStepIDs, recipeID, stepID } = options;

    try {
      let q = db.from('recipeSteps').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeStepID', { ascending: true });

      if (recipeStepIDs) {
        q = q.in('recipeStepID', recipeStepIDs);
      }
      if (recipeID) {
        q = q.filter('recipeID', 'eq', recipeID);
      }
      if (stepID) {
        q = q.filter('stepID', 'eq', stepID);
      }

      const { data: recipeSteps, error } = await q;

      if (error) {
        throw errorGen(`Error getting recipeSteps: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeSteps-getAll* Got ${recipeSteps.length} recipeSteps`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return recipeSteps;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps getAll', err.code || 520, err.name || 'unhandledError_recipeSteps-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getStepByID(options) {
    try {
      const { data, error } = await db.from('recipeSteps').select().eq('recipeStepID', options.recipeStepID).eq('deleted', false).single();
      if (error) {
        throw errorGen(`Error getting recipeStep by ID: ${options.recipeStepID}:${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeSteps-getStepByID* Got recipeStep ${options.recipeStepID}`, level: 6, timestamp: new Date().toISOString(), userID: options.userID || 0 });
      return data;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps getStepByID', err.code || 520, err.name || 'unhandledError_recipeSteps-getStepByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, stepID, sequence, photoURL } = options;

    try {
      //validate that provided recipeID exists
      const { data: recipe, validationError } = await db.from('recipes').select().eq('recipeID', recipeID);
      if (validationError) {
        throw errorGen(`Error validating recipe ID: ${recipeID} while creating recipeStep ${validationError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipe.length) {
        throw errorGen(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeStep`, 515, 'cannotComplete', false, 3);
      }

      //validate that provided stepID exists
      const { data: step, error: stepError } = await db.from('steps').select().eq('stepID', stepID);
      if (stepError) {
        throw errorGen(`Error validating step ID: ${stepID} while creating recipeStep ${stepError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!step.length) {
        throw errorGen(`Provided step ID: ${stepID} does not exist, cannot create recipeStep`, 515, 'cannotComplete', false, 3);
      }

      //if provided recipeID and stepID exist, validate that there is not already a recipeStep with the same recipeID and stepID
      const { data: existingRecipeStep, error: existingRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', false);
      if (existingRecipeStepError) {
        throw errorGen(`Error getting existing recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${existingRecipeStepError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (existingRecipeStep.length) {
        throw errorGen(`RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep`, 515, 'cannotComplete', false, 3);
      }

      //if provided recipeID and stepID exists but is deleted, undelete it and return it
      const { data: deletedRecipeStep, error: deletedRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', true);
      if (deletedRecipeStepError) {
        throw errorGen(`Error getting deleted recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${deletedRecipeStepError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (deletedRecipeStep.length) {
        const { error: undeleteError } = await db.from('recipeSteps').update({ deleted: false }).eq('recipeStepID', deletedRecipeStep[0].recipeStepID).single();
        if (undeleteError) {
          throw errorGen(`Error undeleting recipeStep: ${undeleteError.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        if (recipe[0].status === 'noSteps') {
          await publish(recipeID, deletedRecipeStep[0].recipeStepID, userID, authorization);
        }
        const logID1 = await createRecipeLog(userID, authorization, 'undeleteRecipeStep', Number(deletedRecipeStep[0].recipeStepID), Number(recipeID), null, null, `undeleted recipeStep with ID: ${deletedRecipeStep[0].recipeStepID} for recipe ID: ${recipeID} and step ID: ${stepID}`);
        //increment recipe version and add a 'recipeStepAdded' log entry to the recipe
        const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
        createRecipeLog(userID, authorization, 'updatedRecipeVersion', Number(recipeID), Number(logID1), String(recipe[0].version), String(newVersion), `Updated Recipe, ID: ${recipeID} to version: ${newVersion}`);

        return {
          recipeStepID: deletedRecipeStep[0].recipeStepID,
          recipeID: deletedRecipeStep[0].recipeID,
          stepID: deletedRecipeStep[0].stepID,
          sequence: deletedRecipeStep[0].sequence,
        };
      }

      //get existing steps, order by sequence ascending
      const { error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).order('sequence', { ascending: true });
      if (existingRecipeStepsError) {
        throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeID} while creating recipeStep ${existingRecipeStepsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      //validate that provided sequence is positive integer
      if (sequence < 1) {
        throw errorGen(`Provided sequence: ${sequence} is less than 1, cannot create recipeStep`, 510, 'dataValidationErr', false, 3);
      }

      //create recipeStep
      const { data: newRecipeStep, error } = await db.from('recipeSteps').insert({ recipeStepID: customID, userID, recipeID, stepID, sequence, photoURL }).select().single();
      if (error) {
        throw errorGen(`Error creating recipeStep: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }

      //add a 'created' log entry
      const logID2 = await createRecipeLog(userID, authorization, 'createdRecipeStep', newRecipeStep.recipeStepID, Number(recipeID), null, null, `created recipeStep with ID: ${newRecipeStep.recipeStepID}`);
      //increment recipe version and add a 'recipeStepAdded' log entry to the recipe
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID2), String(recipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} version from ${recipe[0].version} to ${newVersion}`);

      if (recipe[0].status === 'noSteps') {
        await publish(recipeID, newRecipeStep.recipeStepID, userID, authorization);
      }
      global.logger.info({ message: `*recipeSteps-create* Created recipeStep ${newRecipeStep.recipeStepID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      // return newRecipeStep;
      return {
        recipeStepID: newRecipeStep.recipeStepID,
        recipeID: newRecipeStep.recipeID,
        stepID: newRecipeStep.stepID,
        sequence: newRecipeStep.sequence,
        photoURL: newRecipeStep.photoURL,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps create', err.code || 520, err.name || 'unhandledError_recipeSteps-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function publish(recipeID, recipeStepID, userID, authorization) {
    try {
      const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
      if (recipeUpdateError) {
        global.logger.info({ message: `*recipeSteps-publish* Error updating recipe status: ${recipeUpdateError.message}`, level: 3, timestamp: new Date().toISOString(), userID: userID });
        //rollback recipeStep creation
        const { error: rollbackError } = await db.from('recipeSteps').delete().eq('recipeStepID', recipeStepID);
        if (rollbackError) {
          throw errorGen(`Error rolling back recipeStep: ${rollbackError.message}`, 514, 'failSupabaseDelete', true, 3);
        }
        throw errorGen(`Error updating recipe status: ${recipeUpdateError.message}. Rolled back`, 515, 'cannotComplete', false, 3);
      }
      global.logger.info({ message: `*recipeSteps-publish* Recipe moved to "published" status`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      //add 'recipePublished' log entry
      createRecipeLog(userID, authorization, 'updatedRecipeStatus', Number(recipeID), null, null, 'published', `updated recipe status to published`);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps publish', err.code || 520, err.name || 'unhandledError_recipeSteps-publish', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { authorization, recipeStepID, sequence, photoURL } = options;

    try {
      //validate that provided recipeStepID exists
      const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID);
      if (validationError) {
        throw errorGen(`Error validating recipeStep ID: ${recipeStepID} while updating recipeStep ${validationError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeStep.length) {
        throw errorGen(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot update recipeStep`, 515, 'cannotComplete', false, 3);
      }

      if (sequence) {
        //if provided sequence is same as existing sequence and no photoURL provided, do nothing
        if (sequence === recipeStep[0].sequence && !photoURL) {
          throw errorGen(`Provided sequence: ${sequence} is the same as existing sequence, no update needed`, 510, 'dataValidationErr', false, 3);
        }
        //validate that provided sequence is positive integer
        if (sequence < 1) {
          throw errorGen(`Provided sequence: ${sequence} is less than 1, cannot update recipeStep`, 510, 'dataValidationErr', false, 3);
        }

        //get existing steps, order by sequence ascending
        const { error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).order('sequence', { ascending: true });
        if (existingRecipeStepsError) {
          throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while updating recipeStep ${existingRecipeStepsError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
      }
      const updateFields = {};
      if (sequence) {
        updateFields.sequence = sequence;
      }
      if (photoURL) {
        updateFields.photoURL = photoURL;
      }
      const updatedRecipeStep = await updater(options.userID, authorization, 'recipeStepID', recipeStepID, 'recipeSteps', updateFields);
      return updatedRecipeStep;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps update', err.code || 520, err.name || 'unhandledError_recipeSteps-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteStep(options) {
    const { recipeStepID, authorization, userID } = options;

    try {
      //validate that provided recipeStepID exists
      const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID).eq('deleted', false);
      if (validationError) {
        throw errorGen(`Error validating recipeStep ID: ${recipeStepID} while deleting recipeStep ${validationError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      if (!recipeStep.length) {
        throw errorGen(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot delete recipeStep`, 515, 'cannotComplete', false, 3);
      }

      //if recipeStep has photoURL, delete the photo first by calling router.delete('/uploads/image', routeValidator(deleteImageSchema_body, 'body'), errorCatcher(h.deleteS3Photo));
      if (recipeStep[0].photoURL) {
        try {
          await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/uploads/image`, {
            data: {
              userId: userID,
              photoURL: recipeStep[0].photoURL,
              type: 'recipeStep',
              id: recipeStepID,
            },
            headers: {
              authorization: authorization,
            },
          });
          global.logger.info({ message: `*recipeSteps-deleteStep* Deleted photo for recipeStepID ${recipeStepID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
        } catch (err) {
          throw errorGen(err.message || `Error deleting photo for recipeStep ${recipeStepID}: ${err.message}`, err.code || 520, err.name || 'unhandledError_recipeSteps-deleteStep', err.isOperational || false, err.severity || 2);
        }
      }

      //get existing steps for recipeID of provided recipeStepID, order by sequence ascending, only get undeleted steps
      const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).eq('deleted', false).order('sequence', { ascending: true });

      if (existingRecipeStepsError) {
        throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while deleting recipeStep ${existingRecipeStepsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      //delete recipeStep
      const { error: deleteError } = await db.from('recipeSteps').update({ deleted: true }).eq('recipeStepID', recipeStepID);
      if (deleteError) {
        throw errorGen(`Error deleting recipeStep ${recipeStepID}: ${deleteError.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      //add a 'deleted' log entry
      const logID1 = await createRecipeLog(userID, authorization, 'deleteRecipeStep', Number(recipeStepID), Number(recipeStep[0].recipeID), null, null, `deleted recipeStep with ID: ${recipeStepID}`);
      //update version of associated recipe and log the change
      //get recipe version
      const version = await getRecipeVersion(recipeStep[0].recipeID);
      if (!version) {
        throw errorGen(`Error getting recipe version for recipeID:${recipeStep[0].recipeID} after deleting recipeStep`, 515, 'cannotComplete', false, 3);
      } else {
        const newVersion = await incrementVersion('recipes', 'recipeID', recipeStep[0].recipeID, version);
        createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeStep[0].recipeID), Number(logID1), String(version), String(newVersion), `updated version of recipe ID:${recipeStep[0].recipeID} from ${version} to ${newVersion}`);
      }

      //delete step associated with recipeStep
      const { error: deleteStepError } = await db.from('steps').update({ deleted: true }).eq('stepID', recipeStep[0].stepID);
      if (deleteStepError) {
        throw errorGen(`Error deleting associated step ${recipeStep[0].stepID}: ${deleteStepError.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      //add a 'deleted' log entry
      createRecipeLog(userID, authorization, 'deleteStep', Number(recipeStep[0].stepID), null, null, null, `deleted step with ID: ${recipeStep[0].stepID}`);

      //if recipe has no remaining steps, update recipe status to 'noSteps'
      if (existingRecipeSteps.length === 1) {
        const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeStep[0].recipeID);
        if (recipeUpdateError) {
          throw errorGen(`Error updating recipe status: ${recipeUpdateError.message}`, 514, 'failSupabaseDelete', true, 3);
        }
        global.logger.info({ message: `*recipeSteps-deleteStep* Recipe now has no Steps. Updated recipe status to noSteps`, level: 6, timestamp: new Date().toISOString(), userID: userID || 0 });
      }

      //decrement the sequence of all recipeSteps with sequence > existing sequence
      for (let i = recipeStep[0].sequence; i < existingRecipeSteps.length; i++) {
        await sequenceShifter(userID, authorization, existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence - 1);
      }
      global.logger.info({ message: `*recipeSteps-deleteStep* Decremented sequence of all recipeSteps with sequence greater than deleted recipeStep ID ${recipeStepID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in recipeSteps deleteStep', err.code || 520, err.name || 'unhandledError_recipeSteps-deleteStep', err.isOperational || false, err.severity || 2);
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
