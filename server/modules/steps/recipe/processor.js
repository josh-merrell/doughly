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
    const { userID, recipeID, stepID, sequence } = options;
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
    const { data: existingRecipeStep, error: existingRecipeStepError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).eq('stepID', stepID);
    if (existingRecipeStepError) {
      global.logger.info(`Error getting existing recipeStep for recipe ID: ${recipeID} and step ID: ${stepID} while creating recipeStep ${existingRecipeStepError.message}`);
      return { error: existingRecipeStepError.message };
    }
    if (existingRecipeStep.length) {
      global.logger.info(`RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep`);
      return { error: `RecipeStep with recipe ID: ${recipeID} and step ID: ${stepID} already exists, cannot duplicate recipeStep` };
    }

    //get existing steps, order by sequence ascending
    const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeID).order('sequence', { ascending: true });
    if (existingRecipeStepsError) {
      global.logger.info(`Error getting existing recipeSteps for recipe ID: ${recipeID} while creating recipeStep ${existingRecipeStepsError.message}`);
      return { error: existingRecipeStepsError.message };
    }
    //validate that provided sequence is positive integer, and is less than the number of steps in the recipe + 1
    if (sequence < 1) {
      global.logger.info(`Provided sequence: ${sequence} is less than 1, cannot create recipeStep`);
      return { error: `Provided sequence: ${sequence} is less than 1, cannot create recipeStep` };
    }
    if (sequence > existingRecipeSteps.length + 1) {
      global.logger.info(`Provided sequence: ${sequence} is greater than the number of steps in the recipe + 1, cannot create recipeStep`);
      return { error: `Provided sequence: ${sequence} is greater than the number of steps in the recipe + 1, cannot create recipeStep` };
    }

    //if sequence is less than number of steps in recipe + 1, increment the sequence of all recipeSteps with sequence >= provided sequence
    for (let i = existingRecipeSteps.length - 1; i >= sequence - 1; i--) {
      const { error: sequenceShiftError } = await updater('recipeStepID', existingRecipeSteps[i].recipeStepID, 'recipeSteps', { sequence: existingRecipeSteps[i].sequence + 1 });
      if (sequenceShiftError) {
        global.logger.info(`Error shifting sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} while creating recipeStep ${sequenceShiftError.message}`);
        return { error: sequenceShiftError.message };
      }
      global.logger.info(`Shifted sequence of recipeStep ID: ${existingRecipeSteps[i].recipeStepID} to ${existingRecipeSteps[i].sequence + 1}`);
    }

    const { data: newRecipeStep, error } = await db.from('recipeSteps').insert({ userID, recipeID, stepID, sequence }).select().single();

    if (error) {
      global.logger.info(`Error creating recipeStep: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created recipeStep ${newRecipeStep.recipeStepID}`);
    return newRecipeStep;
  }

  async function update(options) {
    const { recipeStepID, sequence } = options;

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
    //if provided sequence is same as existing sequence, do nothing
    if (sequence === recipeStep[0].sequence) {
      global.logger.info(`Provided sequence: ${sequence} is the same as existing sequence, no update needed`);
      return recipeStep[0];
    }

    //validate that provided sequence is positive integer, and is less than the number of steps in the recipe
    if (sequence < 1) {
      global.logger.info(`Provided sequence: ${sequence} is less than 1, cannot update recipeStep`);
      return { error: `Provided sequence: ${sequence} is less than 1, cannot update recipeStep` };
    }

    //get existing steps, order by sequence ascending
    const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).order('sequence', { ascending: true });
    if (existingRecipeStepsError) {
      global.logger.info(`Error getting existing recipeSteps for recipe ID: ${recipeStep[0].recipeID} while updating recipeStep ${existingRecipeStepsError.message}`);
      return { error: existingRecipeStepsError.message };
    }
    if (sequence > existingRecipeSteps.length) {
      global.logger.info(`Provided sequence: ${sequence} is greater than the number of steps in the recipe, cannot update recipeStep`);
      return { error: `Provided sequence: ${sequence} is greater than the number of steps in the recipe, cannot update recipeStep` };
    }

    //if provided sequence is less than existing sequence, increment the sequence of all recipeSteps with sequence >= provided sequence and < existing sequence
    if (sequence < recipeStep[0].sequence) {
      for (let i = recipeStep[0].sequence - 1; i >= sequence - 1; i--) {
        const { error: sequenceShiftError } = await sequenceShifter(existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence + 1);
        if (sequenceShiftError) {
          return { error: sequenceShiftError.message };
        }
      }
    }

    //if provided sequence is greater than existing sequence, decrement the sequence of all recipeSteps with sequence <= provided sequence and > existing sequence
    if (sequence > recipeStep[0].sequence) {
      for (let i = recipeStep[0].sequence; i <= sequence - 1; i++) {
        const { error: sequenceShiftError } = await sequenceShifter(existingRecipeSteps[i].recipeStepID, existingRecipeSteps[i].sequence - 1);
        if (sequenceShiftError) {
          return { error: sequenceShiftError.message };
        }
      }
    }

    const updateFields = { sequence: sequence };

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
    const { recipeStepID } = options;
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

    //get existing steps for recipeID of provided recipeStepID, order by sequence ascending
    const { data: existingRecipeSteps, error: existingRecipeStepsError } = await db.from('recipeSteps').select().eq('recipeID', recipeStep[0].recipeID).order('sequence', { ascending: true });

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
