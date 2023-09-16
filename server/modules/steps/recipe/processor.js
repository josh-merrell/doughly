const axios = require('axios');

('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  const sequenceShifter = async (recipeStepID, newSeq) => {
    const { err } = await updater('recipeStepID', recipeStepID, 'recipeSteps', { sequence: newSeq });
    if (err) {
      global.logger.info(`Error shifting sequence of recipeStep ID: ${recipeStepID} while updating recipeStep ${err.message}`);
      return { error: err.message };
    }
    global.logger.info(`Shifted sequence of recipeStep ID: ${recipeStepID} to ${newSeq}`);
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
      global.logger.info(`Error getting recipeSteps: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeSteps.length} recipeSteps`);
    return recipeSteps;
  }

  async function getStepByID(options) {
    const { data, error } = await db.from('recipeSteps').select().eq('recipeStepID', options.recipeStepID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting recipeStep by ID: ${options.recipeStepID}:${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeStep ${options.recipeStepID}`);
    return data;
  }

  async function create(options) {
    const { userID, recipeID, stepID, sequence, photoURL } = options;
    //validate that provided recipeID exists
    const { data: recipe, validationError } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (validationError) {
      global.logger.info(`Error validating recipe ID: ${recipeID} while creating recipeStep ${validationError.message}`);
      return { error: validationError.message };
    }
    if (!recipe.length) {
      global.logger.info(`Provided recipe ID: ${recipeID} does not exist, cannot create recipeStep`);
      return { error: `Provided recipe ID: ${recipeID} does not exist, cannot create recipeStep` };
    }

    //validate that provided stepID exists
    const { data: step, error: stepError } = await db.from('steps').select().eq('stepID', stepID);
    if (stepError) {
      global.logger.info(`Error validating step ID: ${stepID} while creating recipeStep ${stepError.message}`);
      return { error: stepError.message };
    }
    if (!step.length) {
      global.logger.info(`Provided step ID: ${stepID} does not exist, cannot create recipeStep`);
      return { error: `Provided step ID: ${stepID} does not exist, cannot create recipeStep` };
    }

    //if provided recipeID and stepID exist, validate that there is not already a recipeStep with the same recipeID and stepID
    const { data: existingRecipeStep, error: existingRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', false);
    if (existingRecipeStepError) {
      global.logger.info(`Error getting existing recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${existingRecipeStepError.message}`);
      return { error: existingRecipeStepError.message };
    }
    if (existingRecipeStep.length) {
      global.logger.info(`RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep`);
      return { error: `RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep` };
    }

    //if provided recipeID and stepID exists but is deleted, undelete it and return it
    const { data: deletedRecipeStep, error: deletedRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID).eq('deleted', true);
    if (deletedRecipeStepError) {
      global.logger.info(`Error getting deleted recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${deletedRecipeStepError.message}`);
      return { error: deletedRecipeStepError.message };
    }
    if (deletedRecipeStep.length) {
      const { error: undeleteError } = await db.from('recipeSteps').update({ deleted: false }).eq('recipeStepID', deletedRecipeStep[0].recipeStepID).single();
      if (undeleteError) {
        global.logger.info(`Error undeleting recipeStep: ${undeleteError.message}`);
        return { error: undeleteError.message };
      }
      if (recipe[0].status === 'noSteps') {
        await publish(recipeID, deletedRecipeStep[0].recipeStepID);
      }
      global.logger.info(`Undeleted recipeStep ${deletedRecipeStep[0].recipeStepID}`);

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
      global.logger.info(`Error getting existing recipeSteps for recipe ID: ${recipeID} while creating recipeStep ${existingRecipeStepsError.message}`);
      return { error: existingRecipeStepsError.message };
    }
    //validate that provided sequence is positive integer
    if (sequence < 1) {
      global.logger.info(`Provided sequence: ${sequence} is less than 1, cannot create recipeStep`);
      return { error: `Provided sequence: ${sequence} is less than 1, cannot create recipeStep` };
    }

    /** FOR NOW WE ARE NOT USING THIS SMART SEQUENCE SHIFTING LOGIC, THE FRONTEND WILL CALL EACH NEEDED SHIFT DIRECTLY
    //if sequence is less than number of steps in recipe + 1, increment the sequence of all recipeSteps with sequence >= provided sequence
    // for (let i = existingRecipeSteps.length - 1; i >= sequence - 1; i--) {
    //   const { error: sequenceShiftError } = await updater('recipeStepID', existingRecipeSteps[i].recipeStepID, 'recipeSteps', { sequence: existingRecipeSteps[i].sequence + 1 });
    //   if (sequenceShiftError) {
    //     global.logger.info(`Error shifting sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} while creating recipeStep ${sequenceShiftError.message}`);
    //     return { error: sequenceShiftError.message };
    //   }
    //   global.logger.info(`Shifted sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} to ${existingRecipeSteps[i].sequence + 1}`);
    // }
    **/

    //create recipeStep
    const { data: newRecipeStep, error } = await db.from('recipeSteps').insert({ userID, recipeID, stepID, sequence, photoURL }).select().single();

    if (error) {
      global.logger.info(`Error creating recipeStep: ${error.message}`);
      return { error: error.message };
    }

    if (recipe[0].status === 'noSteps') {
      await publish(recipeID, newRecipeStep.recipeStepID);
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

  async function publish(recipeID, recipeStepID) {
    const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'published' }).eq('recipeID', recipeID);
    if (recipeUpdateError) {
      global.logger.info(`Error updating recipe status: ${recipeUpdateError.message}`);
      //rollback recipeStep creation
      const { error: rollbackError } = await db.from('recipeSteps').delete().eq('recipeStepID', recipeStepID);
      if (rollbackError) {
        global.logger.info(`Error rolling back recipeStep: ${rollbackError.message}`);
        return { error: rollbackError.message };
      }
      return { error: recipeUpdateError.message };
    }
    global.logger.info(`Updated recipe status to published`);
  }

  async function update(options) {
    const { recipeStepID, sequence, photoURL } = options;

    //validate that provided recipeStepID exists
    const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID);
    if (validationError) {
      global.logger.info(`Error validating recipeStep ID: ${recipeStepID} while updating recipeStep ${validationError.message}`);
      return { error: validationError.message };
    }
    if (!recipeStep.length) {
      global.logger.info(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot update recipeStep`);
      return { error: `Provided recipeStep ID: ${recipeStepID} does not exist, cannot update recipeStep` };
    }

    if (sequence) {
      //if provided sequence is same as existing sequence and no photoURL provided, do nothing
      if (sequence === recipeStep[0].sequence && !photoURL) {
        global.logger.info(`Provided sequence: ${sequence} is the same as existing sequence, no update needed`);
        return recipeStep[0];
      }
      //validate that provided sequence is positive integer
      if (sequence < 1) {
        global.logger.info(`Provided sequence: ${sequence} is less than 1, cannot update recipeStep`);
        return { error: `Provided sequence: ${sequence} is less than 1, cannot update recipeStep` };
      }

      //get existing steps, order by sequence ascending
      const { error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).order('sequence', { ascending: true });
      if (existingRecipeStepsError) {
        global.logger.info(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while updating recipeStep ${existingRecipeStepsError.message}`);
        return { error: existingRecipeStepsError.message };
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
    const updateFields = { sequence: sequence, photoURL: photoURL };

    try {
      const updatedRecipeStep = await updater('recipeStepID', recipeStepID, 'recipeSteps', updateFields);
      global.logger.info(`Updated recipeStep ${recipeStepID}`);
      return updatedRecipeStep;
    } catch (err) {
      global.logger.info(`Error updating recipeStep ${recipeStepID}: ${err.message}`);
      return { error: err.message };
    }
  }

  async function deleteStep(options) {
    const { recipeStepID, authorization, userID } = options;
    //validate that provided recipeStepID exists
    const { data: recipeStep, validationError } = await db.from('recipeSteps').select().eq('recipeStepID', recipeStepID).eq('deleted', false);
    if (validationError) {
      global.logger.info(`Error validating recipeStep ID: ${recipeStepID} while deleting recipeStep ${validationError.message}`);
      return { error: validationError.message };
    }
    if (!recipeStep.length) {
      global.logger.info(`Provided recipeStep ID: ${recipeStepID} does not exist, cannot delete recipeStep`);
      return { error: `Provided recipeStep ID: ${recipeStepID} does not exist, cannot delete recipeStep` };
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
        global.logger.info(`Error deleting photo for recipeStep ${recipeStepID}: ${err.message}`);
        return { error: err.message };
      }
    }

    //get existing steps for recipeID of provided recipeStepID, order by sequence ascending, only get undeleted steps
    const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).eq('deleted', false).order('sequence', { ascending: true });

    if (existingRecipeStepsError) {
      global.logger.info(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while deleting recipeStep ${existingRecipeStepsError.message}`);
      return { error: existingRecipeStepsError.message };
    }

    //delete recipeStep
    const { error: deleteError } = await db.from('recipeSteps').update({ deleted: true }).eq('recipeStepID', recipeStepID);
    if (deleteError) {
      global.logger.info(`Error deleting recipeStep ${recipeStepID}: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    global.logger.info(`Deleted recipeStep ${recipeStepID}`);

    //delete step associated with recipeStep
    const { error: deleteStepError } = await db.from('steps').update({ deleted: true }).eq('stepID', recipeStep[0].stepID);
    if (deleteStepError) {
      global.logger.info(`Error deleting associated step ${recipeStep[0].stepID}: ${deleteStepError.message}`);
      return { error: deleteStepError.message };
    }
    global.logger.info(`Deleted step ${recipeStep[0].stepID}`);

    //if recipe has no remaining steps, update recipe status to 'noSteps'
    if (existingRecipeSteps.length === 1) {
      const { error: recipeUpdateError } = await db.from('recipes').update({ status: 'noSteps' }).eq('recipeID', recipeStep[0].recipeID);
      if (recipeUpdateError) {
        global.logger.info(`Error updating recipe status: ${recipeUpdateError.message}`);
        return { error: recipeUpdateError.message };
      }
      global.logger.info(`Recipe now has no Steps. Updated recipe status to noSteps`);
    }

    //decrement the sequence of all recipeSteps with sequence > existing sequence
    for (let i = recipeStep[0].sequence; i < existingRecipeSteps.length; i++) {
      await sequenceShifter(existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence - 1);
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
