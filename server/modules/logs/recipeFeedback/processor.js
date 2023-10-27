('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, satisfaction, recipeID, difficulty, createdAfter, createdBefore } = options;
    let q = db.from('recipeFeedbacks').select().filter('userID', 'eq', userID).order('recipeFeedbackID', { ascending: true });
    if (logIDs) {
      q = q.in('recipeFeedbackID', logIDs);
    }
    if (satisfaction) {
      q = q.filter('satisfaction', 'eq', satisfaction);
    }
    if (difficulty) {
      q = q.like('difficulty', difficulty);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (createdAfter) {
      q = q.gte('createdTime', createdAfter);
    }
    if (createdBefore) {
      q = q.lte('createdTime', createdBefore);
    }
    const { data: logs, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeFeedback logs: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${logs.length} recipeFeedback logs`);
    return logs;
  }

  async function getByID(options) {
    const { logID } = options;
    const { data: log, error } = await db.from('recipeFeedbacks').select().eq('recipeFeedbackID', logID);

    if (error) {
      global.logger.info(`Error getting recipeFeedback log: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeFeedback log`);
    return log;
  }

  async function create(options) {
    const { customID, userID, recipeID, satisfaction, difficulty, note } = options;
    const logTime = new Date().toISOString();

    const { data: log, error } = await db.from('recipeFeedbacks').insert({ recipeFeedbackID: customID, userID, logTime, recipeID, satisfaction, difficulty, note }).select('*').single();

    if (error) {
      global.logger.info(`Error creating recipeFeedback log: ${error.message}`);
      return { error: error.message };
    }
    return {
      recipeFeedbackID: log.recipeFeedbackID,
    };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
  };
};
