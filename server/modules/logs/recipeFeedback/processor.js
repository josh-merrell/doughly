('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    try {
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
        throw errorGen(`*recipeFeedbackLogs-getAll* Error getting recipeFeedback logs: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*recipeFeedbackLogs-getAll* Got ${logs.length} recipeFeedback logs`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return logs;
    } catch (err) {
      throw errorGen(err.message || '*recipeFeedbackLogs-getAll* Unhandled Error ', err.code || 520, err.name || 'unhandledError_recipeFeedbackLogs-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('recipeFeedbacks').select().eq('recipeFeedbackID', logID);

      if (error) {
        throw errorGen(`*recipeFeedbackLogs-getByID* Error getting recipeFeedback log: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*recipeFeedbackLogs-getByID* Got recipeFeedback log with ID: ${log[0].logID}`, level:6, timestamp: new Date().toISOString(), 'userID': log[0].userID});
      return log;
    } catch (err) {
      throw errorGen(err.message || '*recipeFeedbackLogs-getByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeFeedbackLogs-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, recipeID, satisfaction, difficulty, note, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('recipeFeedbacks').insert({ recipeFeedbackID: customID, userID, logTime, recipeID, satisfaction, difficulty, note, message }).select('*').single();

      if (error) {
        // throw errorGen(`*recipeFeedbackLogs-create* Error creating recipeFeedback log: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
        global.logger.error({message:`*recipeFeedbackLogs-create* Error creating recipeFeedback log: ${error.message}`, level:3, timestamp: new Date().toISOString(), 'userID': userID});
        return {
          recipeFeedbackID: 0
        } 
      }
      return {
        recipeFeedbackID: log.recipeFeedbackID,
      };
    } catch (err) {
      throw errorGen(err.message || '*recipeFeedbackLogs-create* Unhandled Error ', err.code || 520, err.name || 'unhandledError_recipeFeedbackLogs-create', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
  };
};
