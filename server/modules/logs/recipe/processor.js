('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;

    try {
      console.log(`RECIPE LOGS: ${JSON.stringify(options)}`);
      let q = db.from('recipeLogs').select().filter('userID', 'eq', userID).order('recipeLogID', { ascending: true });
      if (logIDs && logIDs !== 'undefined') {
        q = q.in('recipeLogID', logIDs);
      }
      if (subjectID && subjectID !== 'undefined') {
        q = q.filter('subjectID', 'eq', subjectID);
      }
      if (eventType && eventType !== 'undefined') {
        q = q.like('eventType', eventType);
      }
      if (createdAfter && createdAfter !== 'undefined') {
        q = q.gte('logTime', createdAfter);
      }
      if (createdBefore && createdBefore !== 'undefined') {
        q = q.lte('logTime', createdBefore);
      }
      const { data: logs, error } = await q;

      if (error) {
        throw errorGen(`*recipeLogs-getAll* Error getting logs: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeLogs-getAll* Got ${logs.length} recipe logs`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return logs;
    } catch (err) {
      throw errorGen(err.message || '*recipeLogs-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeLogs-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('recipeLogs').select().eq('recipeLogID', logID);

      if (error) {
        throw errorGen(`*recipeLogs-getByID* Error getting log: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({ message: `*recipeLogs-getByID* Got log with ID: ${log[0].logID}`, level: 5, timestamp: new Date().toISOString(), userID: log[0].userID });
      return log;
    } catch (err) {
      throw errorGen(err.message || '*recipeLogs-getByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeLogs-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('recipeLogs').insert({ recipeLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        global.logger.error({ message: `*recipeLogs-create* Error creating recipeLog: ${error.message}`, level: 3, timestamp: new Date().toISOString(), userID });
        // throw errorGen(`*recipeLogs-create* Error creating recipeLog: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
        return {
          recipeLogID: 0
        }  
      }
      return {
        recipeLogID: log.recipeLogID,
      };
    } catch (err) {
      throw errorGen(err.message || '*recipeLogs-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_recipeLogs-create', err.isOperational || false, err.severity || 2);
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
