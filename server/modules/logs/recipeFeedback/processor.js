('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { onlyMe, userID, logIDs, satisfaction, recipeID, difficulty, createdAfter, createdBefore } = options;
    let q = db.from('recipeFeedbacks').select().order('recipeFeedbackID', { ascending: true });
    if (onlyMe === 'true' && userID && userID !== 'undefined') {
      q = q.filter('userID', 'eq', userID);
    }
    if (logIDs && logIDs !== 'undefined') {
      q = q.in('recipeFeedbackID', logIDs);
    }
    if (satisfaction && satisfaction !== 'undefined') {
      q = q.filter('satisfaction', 'eq', satisfaction);
    }
    if (difficulty && difficulty !== 'undefined') {
      q = q.like('difficulty', difficulty);
    }
    if (recipeID && recipeID !== 'undefined') {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (createdAfter && createdAfter !== 'undefined') {
      q = q.gte('logTime', createdAfter);
    }
    if (createdBefore && createdBefore !== 'undefined') {
      q = q.lte('logTime', createdBefore);
    }
    const { data: logs, error } = await q;

    if (error) {
      global.logger.error(`Error getting recipeFeedback logs: ${error.message}`);
      throw errorGen('Error getting recipeFeedback logs', 400);
    }
    global.logger.info(`Got ${logs.length} recipeFeedback logs`);
    return logs;
  }

  async function getByID(options) {
    const { logID } = options;
    const { data: log, error } = await db.from('recipeFeedbacks').select().eq('recipeFeedbackID', logID);

    if (error) {
      global.logger.error(`Error getting recipeFeedback log: ${error.message}`);
      throw errorGen(`Error getting recipeFeedback log: ${error.message}`, 400);
    }
    global.logger.info(`Got recipeFeedback log`);
    return log;
  }

  async function create(options) {
    const { customID, userID, recipeID, satisfaction, difficulty, note, message } = options;
    const logTime = new Date().toISOString();

    const { data: log, error } = await db.from('recipeFeedbacks').insert({ recipeFeedbackID: customID, userID, logTime, recipeID, satisfaction, difficulty, note, message }).select('*').single();

    if (error) {
      global.logger.error(`Error creating recipeFeedback log: ${error.message}`);
      throw errorGen(`Error creating recipeFeedback log: ${error.message}`, 400);
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
