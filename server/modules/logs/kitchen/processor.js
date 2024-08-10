('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;

    try {
      let q = db.from('kitchenLogs').select().filter('userID', 'eq', userID).order('kitchenLogID', { ascending: true });
      if (logIDs && logIDs !== 'undefined') {
        q = q.in('kitchenLogID', logIDs);
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
        throw errorGen(`*kitchenLogs-getAll* Error getting logs: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*kitchenLogs-getAll* Got ${logs.length} kitchen logs`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return logs;
    } catch (err) {
      throw errorGen(err.message || '*kitchenLogs-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_kitchenLogs-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('kitchenLogs').select().eq('kitchenLogID', logID);

      if (error) {
        throw errorGen(`*kitchenLogs-getByID* Error getting log: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*kitchenLogs-getByID* Got log with ID: ${log[0].logID}`, level:6, timestamp: new Date().toISOString(), 'userID': log[0].userID});
      return log;
    } catch (err) {
      throw errorGen(err.message || '*kitchenLogs-getByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_kitchenLogs-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();
      const { data: log, error } = await db.from('kitchenLogs').insert({ kitchenLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        throw errorGen(`*kitchenLogs-create* Error creating kitchenLog: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      return {
        kitchenLogID: log.kitchenLogID,
      };
    } catch (err) {
      throw errorGen(err.message || '*kitchenLogs-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_kitchenLogs-create', err.isOperational || false, err.severity || 2);
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
