const axios = require('axios');

('use strict');
const { createRecipeLog } = require('../../../services/dbLogger');
const { updater, incrementVersion, getRecipeVersion } = require('../../../db');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  const sequenceShifter = async (userID, authorization, recipeStepID, newSeq) => {
    const { err } = await updater(userID, authorization, 'recipeStepID', recipeStepID, 'recipeSteps', { sequence: newSeq });
    if (err) {
      global.logger.error(`Error shifting sequence of recipeStep ID: ${recipeStepID} while updating recipeStep ${err.message}`);
      throw errorGen(`Error shifting sequence of recipeStep ID: ${recipeStepID} while updating recipeStep`, 400);
    }
  };

  async function getAll(options) {
    const { userID, recipeStepIDs, recipeID, stepID } = options;

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
      global.logger.error(`Error getting recipeSteps: ${error.message}`);
      throw errorGen('Error getting recipeSteps', 400);
    }
    global.logger.info(`Got ${recipeSteps.length} recipeSteps`);
    return recipeSteps;
  }

  async function getStepByID(options) {
    const { data, error } = await db.from('recipeSteps').select().eq('recipeStepID', options.recipeStepID).eq('deleted', false).single();
    if (error) {
      global.logger.error(`Error getting recipeStep by ID: ${options.recipeStepID}:${error.message}`);
      throw errorGen(`Error getting recipeStep by ID: ${options.recipeStepID}`, 400);
    }
    global.logger.info(`Got recipeStep ${options.recipeStepID}`);
    return data;
  }

  async function create(options) {
    const { customID, authorization, userID, recipeID, stepID, sequence, photoURL } = options;
    //validate that provided recipeID exists
    const { data: recipe, validationError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (validationError) {
      global.logger.error(`Error validating recipe ID: ${recipeID} while creating recipeStep ${validationError.message}`);
      throw errorGen(`Error validating recipe ID: ${recipeID} while creating recipeStep`, 400);
    }
    if (!recipe.length) {
      global.logger.error(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeStep`);
      throw errorGen(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeStep`, 400);
    }

    //validate that provided stepID exists
    const { data: step, error: stepError } = await db.from('steps').select().eq('stepID', stepID);
    if (stepError) {
      global.logger.error(`Error validating step ID: ${stepID} while creating recipeStep ${stepError.message}`);
      throw errorGen(`Error validating step ID: ${stepID} while creating recipeStep`, 400);
    }
    if (!step.length) {
      global.logger.error(`Provided step ID: ${stepID} does not exist, cannot create recipeStep`);
      throw errorGen(`Provided step ID: ${stepID} does not exist, cannot create recipeStep`, 400);
    }

    //if provided recipeID and stepID exist, validate that there is not already a recipeStep with the same recipeID and stepID
    const { data: existingRecipeStep, error: existingRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', false);
    if (existingRecipeStepError) {
      global.logger.error(`Error getting existing recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${existingRecipeStepError.message}`);
      throw errorGen(`Error getting existing recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep`, 400);
    }
    if (existingRecipeStep.length) {
      global.logger.error(`RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep`);
      throw errorGen(`RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep`, 400);
    }

    //if provided recipeID and stepID exists but is deleted, undelete it and return it
    const { data: deletedRecipeStep, error: deletedRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', true);
    if (deletedRecipeStepError) {
      global.logger.error(`Error getting deleted recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${deletedRecipeStepError.message}`);
      throw errorGen(`Error getting deleted recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep`, 400);
    }
    if (deletedRecipeStep.length) {
      const { error: undeleteError } = await db.from('recipeSteps').update({ deleted: false }).eq('recipeStepID', deletedRecipeStep[0].recipeStepID).single();
      if (undeleteError) {
        global.logger.error(`Error undeleting recipeStep: ${undeleteError.message}`);
        throw errorGen(`Error undeleting recipeStep: ${undeleteError.message}`, 400);
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
      global.logger.error(`Error getting existing recipeSteps for recipe ID: ${recipeID} while creating recipeStep ${existingRecipeStepsError.message}`);
      throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeID} while creating recipeStep`, 400);
    }
    //validate that provided sequence is positive integer
    if (sequence < 1) {
      global.logger.error(`Provided sequence: ${sequence} is less than 1, cannot create recipeStep`);
      throw errorGen(`Provided sequence: ${sequence} is less than 1, cannot create recipeStep`, 400);
    }

    /** FOR NOW WE ARE NOT USING THIS SMART SEQUENCE SHIFTING LOGIC, THE FRONTEND WILL CALL EACH NEEDED SHIFT DIRECTLY
    //if sequence is less than number of steps in recipe + 1, increment the sequence of all recipeSteps with sequence >= provided sequence
    // for (let i = existingRecipeSteps.length - 1; i >= sequence - 1; i--) {
    //   const { error: sequenceShiftError } = await updater(userID, authorization, 'recipeStepID', existingRecipeSteps[i].recipeStepID, 'recipeSteps', { sequence: existingRecipeSteps[i].sequence + 1 });
    //   if (sequenceShiftError) {
    //     global.logger.info(`Error shifting sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} while creating recipeStep ${sequenceShiftError.message}`);
    //     return { error: sequenceShiftError.message };
    //   }
    //   global.logger.info(`Shifted sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} to ${existingRecipeSteps[i].sequence + 1}`);
    // }
    **/

    //create recipeStep
    const { data: newRecipeStep, error } = await db.from('recipeSteps').insert({ recipeStepID: customID, userID, recipeID, stepID, sequence, photoURL }).select().single();
    if (error) {
      global.logger.error(`Error creating recipeStep: ${error.message}`);
      throw errorGen(`Error creating recipeStep: ${error.message}`, 400);
    }

    //add a 'created' log entry
    const logID2 = await createRecipeLog(userID, authorization, 'createdRecipeStep', newRecipeStep.recipeStepID, Number(recipeID), null, null, `created recipeStep with ID: ${newRecipeStep.recipeStepID}`);
    //increment recipe version and add a 'recipeStepAdded' log entry to the recipe
    const newVersion = await incrementVersion('recipes', 'recipeID', recipeID, recipe[0].version);
    createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeID), Number(logID2), String(recipe[0].version), String(newVersion), `updated recipe, ID: ${recipeID} version from ${recipe[0].version} to ${newVersion}`);

    if (recipe[0].status === 'noSteps') {
      try {
        await publish(recipeID, newRecipeStep.recipeStepID, userID, authorization);
      } catch (err) {
        global.logger.error(`Error publishing recipe: ${err.message}`);
        throw errorGen(`Error publishing recipe: ${err.message}`, 400);
      }
    }
    global.logger.info(`Created recipeStep ${newRecipeStep.recipeStepID}`);
    // return newRecipeStep;
    return {
      recipeStepID: newRecipeStep.recipeStepID,
      recipeID: newRecipeStep.recipeID,
      stepID: newRecipeStep.stepID,
      sequence: newRecipeStep.sequence,
      photoURL: newRecipeStep.photoURL,
    };
  }

  async function publish(recipeID, recipeStepID, userID, authorization) {
    const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
    if (recipeUpdateError) {
      global.logger.error(`Error updating recipe status: ${recipeUpdateError.message}`);
      //rollback recipeStep creation
      const { error: rollbackError } = await db.from('recipeSteps').delete().eq('recipeStepID', recipeStepID);
      if (rollbackError) {
        global.logger.error(`Error rolling back recipeStep: ${rollbackError.message}`);
        throw errorGen(`Error rolling back recipeStep: ${rollbackError.message}`, 400);
      }
      throw errorGen(`Error updating recipe status: ${recipeUpdateError.message}`, 400);
    }
    global.logger.info(`Recipe moved to "published" status`);
    //add 'recipePublished' log entry
    createRecipeLog(userID, authorization, 'updatedRecipeStatus', Number(recipeID), null, null, 'published', `updated recipe status to published`);
  }

  async function update(options) {
    const { authorization, recipeStepID, sequence, photoURL } = options;

    //validate that provided recipeStepID exists
    const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID);
    if (validationError) {
      global.logger.error(`Error validating recipeStep ID: ${recipeStepID} while updating recipeStep ${validationError.message}`);
      throw errorGen(`Error validating recipeStep ID: ${recipeStepID} while updating recipeStep`, 400);
    }
    if (!recipeStep.length) {
      global.logger.error(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot update recipeStep`);
      throw errorGen(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot update recipeStep`, 400);
    }

    if (sequence) {
      //if provided sequence is same as existing sequence and no photoURL provided, do nothing
      if (sequence === recipeStep[0].sequence && !photoURL) {
        global.logger.error(`Provided sequence: ${sequence} is the same as existing sequence, no update needed`);
        throw errorGen(`Provided sequence: ${sequence} is the same as existing sequence, no update needed`, 400);
      }
      //validate that provided sequence is positive integer
      if (sequence < 1) {
        global.logger.error(`Provided sequence: ${sequence} is less than 1, cannot update recipeStep`);
        throw errorGen(`Provided sequence: ${sequence} is less than 1, cannot update recipeStep`, 400);
      }

      //get existing steps, order by sequence ascending
      const { error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).order('sequence', { ascending: true });
      if (existingRecipeStepsError) {
        global.logger.error(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while updating recipeStep ${existingRecipeStepsError.message}`);
        throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while updating recipeStep`, 400);
      }
    }

    /** FOR NOW WE ARE NOT USING THIS SMART SEQUENCE SHIFTING LOGIC, THE FRONTEND WILL CALL EACH NEEDED SHIFT DIRECTLY
    //if provided sequence is less than existing sequence, increment the sequence of all recipeSteps with sequence >= provided sequence and < existing sequence
    // if (sequence < recipeStep[0].sequence) {
    //   for (let i = recipeStep[0].sequence - 1; i >= sequence - 1; i--) {
    //     const { error: sequenceShiftError } = await sequenceShifter(existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence + 1);
    //     if (sequenceShiftError) {
    //       return { error: sequenceShiftError.message };
    //     }
    //   }
    // }

    //if provided sequence is greater than existing sequence, decrement the sequence of all recipeSteps with sequence <= provided sequence and > existing sequence
    // if (sequence > recipeStep[0].sequence) {
    //   for (let i = recipeStep[0].sequence; i <= sequence - 1; i++) {
    //     const { error: sequenceShiftError } = await sequenceShifter(existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence - 1);
    //     if (sequenceShiftError) {
    //       return { error: sequenceShiftError.message };
    //     }
    //   }
    // }
    **/
    const updateFields = {};
    if (sequence) {
      updateFields.sequence = sequence;
    }
    if (photoURL) {
      updateFields.photoURL = photoURL;
    }

    try {
      const updatedRecipeStep = await updater(options.userID, authorization, 'recipeStepID', recipeStepID, 'recipeSteps', updateFields);
      return updatedRecipeStep;
    } catch (err) {
      global.logger.error(`Error updating recipeStep ${recipeStepID}: ${err.message}`);
      throw errorGen(`Error updating recipeStep ${recipeStepID}: ${err.message}`, 400);
    }
  }

  async function deleteStep(options) {
    const { recipeStepID, authorization, userID } = options;
    //validate that provided recipeStepID exists
    const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID).eq('deleted', false);
    if (validationError) {
      global.logger.error(`Error validating recipeStep ID: ${recipeStepID} while deleting recipeStep ${validationError.message}`);
      throw errorGen(`Error validating recipeStep ID: ${recipeStepID} while deleting recipeStep`, 400);
    }
    if (!recipeStep.length) {
      global.logger.error(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot delete recipeStep`);
      throw errorGen(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot delete recipeStep`, 400);
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
        global.logger.info(`Deleted photo for recipeStepID ${recipeStepID}`);
      } catch (err) {
        global.logger.error(`Error deleting photo for recipeStep ${recipeStepID}: ${err.message}`);
        throw errorGen(`Error deleting photo for recipeStep ${recipeStepID}: ${err.message}`, 400);
      }
    }

    //get existing steps for recipeID of provided recipeStepID, order by sequence ascending, only get undeleted steps
    const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).eq('deleted', false).order('sequence', { ascending: true });

    if (existingRecipeStepsError) {
      global.logger.error(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while deleting recipeStep ${existingRecipeStepsError.message}`);
      throw errorGen(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while deleting recipeStep`, 400);
    }

    //delete recipeStep
    const { error: deleteError } = await db.from('recipeSteps').update({ deleted: true }).eq('recipeStepID', recipeStepID);
    if (deleteError) {
      global.logger.error(`Error deleting recipeStep ${recipeStepID}: ${deleteError.message}`);
      throw errorGen(`Error deleting recipeStep ${recipeStepID}: ${deleteError.message}`, 400);
    }
    //add a 'deleted' log entry
    const logID1 = await createRecipeLog(userID, authorization, 'deleteRecipeStep', Number(recipeStepID), Number(recipeStep[0].recipeID), null, null, `deleted recipeStep with ID: ${recipeStepID}`);
    //update version of associated recipe and log the change
    //get recipe version
    const version = await getRecipeVersion(recipeStep[0].recipeID);
    if (!version) {
      global.logger.error(`Error getting recipe version for recipeID:${recipeStep[0].recipeID} after deleting recipeStep`);
      throw errorGen(`Error getting recipe version for recipeID:${recipeStep[0].recipeID} after deleting recipeStep`, 400);
    } else {
      const newVersion = await incrementVersion('recipes', 'recipeID', recipeStep[0].recipeID, version);
      createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipeStep[0].recipeID), Number(logID1), String(version), String(newVersion), `updated version of recipe ID:${recipeStep[0].recipeID} from ${version} to ${newVersion}`);
    }

    //delete step associated with recipeStep
    const { error: deleteStepError } = await db.from('steps').update({ deleted: true }).eq('stepID', recipeStep[0].stepID);
    if (deleteStepError) {
      global.logger.error(`Error deleting associated step ${recipeStep[0].stepID}: ${deleteStepError.message}`);
      throw errorGen(`Error deleting associated step ${recipeStep[0].stepID}: ${deleteStepError.message}`, 400);
    }
    //add a 'deleted' log entry
    createRecipeLog(userID, authorization, 'deleteStep', Number(recipeStep[0].stepID), null, null, null, `deleted step with ID: ${recipeStep[0].stepID}`);

    //if recipe has no remaining steps, update recipe status to 'noSteps'
    if (existingRecipeSteps.length === 1) {
      const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeStep[0].recipeID);
      if (recipeUpdateError) {
        global.logger.error(`Error updating recipe status: ${recipeUpdateError.message}`);
        throw errorGen(`Error updating recipe status: ${recipeUpdateError.message}`, 400);
      }
      global.logger.info(`Recipe now has no Steps. Updated recipe status to noSteps`);
    }

    //decrement the sequence of all recipeSteps with sequence > existing sequence
    for (let i = recipeStep[0].sequence; i < existingRecipeSteps.length; i++) {
      await sequenceShifter(userID, authorization, existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence - 1);
    }
    global.logger.info(`Decremented sequence of all recipeSteps with sequence greater than deleted recipeStep ID ${recipeStepID}`);
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
