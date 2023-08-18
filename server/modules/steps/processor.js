('use strict');

const { updater } = require('../../db');

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
      global.logger.info(`Error getting steps: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${steps.length} steps`);
    return steps;
  }

  async function getStepByID(options) {
    const { data, error } = await db.from('steps').select().eq('stepID', options.stepID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting step by ID: ${options.stepID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { userID, title, description } = options;

    //verify that no steps exist with provided title
    const { data: steps, error: error2 } = await db.from('steps').select('title').eq('title', title).eq('deleted', false);
    if (error2) {
      global.logger.info(`Error validating title: ${title} while creating step ${error2.message}`);
      return { error: error2.message };
    }
    if (steps.length > 0) {
      global.logger.info(`Step with title ${title} already exists, can't use this title`);
      return { error: `Step with title ${title} already exists, can't use this title` };
    }

    //if step with provided title exists but is deleted, undelete it and return it
    const { data: deletedSteps, error: error3 } = await db.from('steps').select().eq('title', title).eq('deleted', true);
    if (error3) {
      global.logger.info(`Error validating title: ${title} while creating step ${error3.message}`);
      return { error: error3.message };
    }
    if (deletedSteps.length > 0) {
      const { error: error4 } = await db.from('steps').update({ deleted: false }).eq('stepID', deletedSteps[0].stepID).single();
      if (error4) {
        global.logger.info(`Error undeleting step: ${error4.message}`);
        return { error: error4.message };
      }
      return {
        stepID: deletedSteps[0].stepID,
        title: deletedSteps[0].title,
        description: deletedSteps[0].description,
      };
    }

    const { data, error } = await db.from('steps').insert({ userID, title, description }).select().single();
    if (error) {
      global.logger.info(`Error creating step: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created step ${data.stepID}`);
    // return data;
    return {
      stepID: data.stepID,
      title: data.title,
      description: data.description,
    };
  }

  async function update(options) {
    const { stepID, title } = options;
    //verify that provided stepID exists
    const { data: step, error } = await db.from('steps').select().eq('stepID', stepID);
    if (error) {
      global.logger.info(`Error validating step ID: ${stepID} while updating step ${error.message}`);
      return { error: error.message };
    }
    if (!step.length) {
      global.logger.info(`Error validating step ID: ${stepID} while updating step`);
      return { error: `Step ${stepID} does not exist` };
    }

    //verify that no steps exist with provided title
    const { data: steps, error: error2 } = await db.from('steps').select('title').eq('title', title);
    if (error2) {
      global.logger.info(`Error validating title: ${title} while updating step ${error2.message}`);
      return { error: error2.message };
    }
    if (steps.length > 0) {
      global.logger.info(`Step with title ${title} already exists, can't use this title`);
      return { error: `Step with title ${title} already exists, can't use this title` };
    }

    const updateFields = {};
    for (let key in options) {
      if (key !== 'stepID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedStep = await updater('stepID', options.stepID, 'steps', updateFields);
      global.logger.info(`Updated steps ID ${stepID}`);
      return updatedStep;
    } catch (err) {
      global.logger.info(`Error updating step: ${err.message}`);
      return { error: err.message };
    }
  }

  async function deleteStep(options) {
    const { stepID } = options;
    //verify that provided stepID exists
    const { data: step, error } = await db.from('steps').select().eq('stepID', stepID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error validating step ID: ${stepID} while deleting step ${error.message}`);
      return { error: error.message };
    }
    if (!step.length) {
      global.logger.info(`Provided step ID: ${stepID} does not exist, can't delete`);
      return { error: `Provided step ID: ${stepID} does not exist, can't delete` };
    }

    const { data, error: deleteError } = await db.from('steps').update({ deleted: true }).eq('stepID', stepID);
    if (deleteError) {
      global.logger.info(`Error deleting step: ${deleteError.message}`);
      return { error: deleteError.message };
    }
    global.logger.info(`Deleted step ${stepID}`);
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
