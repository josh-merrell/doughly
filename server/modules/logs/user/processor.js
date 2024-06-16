('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;

    try {
      let q = db.from('userLogs').select().filter('userID', 'eq', userID).order('userLogID', { ascending: true });
      if (logIDs) {
        q = q.in('userLogID', logIDs);
      }
      if (subjectID) {
        q = q.filter('subjectID', 'eq', subjectID);
      }
      if (eventType) {
        q = q.like('eventType', eventType);
      }
      if (createdAfter) {
        q = q.gte('createdTime', createdAfter);
      }
      if (createdBefore) {
        q = q.lte('createdTime', createdBefore);
      }
      const { data: logs, error } = await q;

      if (error) {
        throw errorGen(`Error getting logs: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`Got ${logs.length} user logs`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return logs;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in userLogs getAll', err.code || 520, err.name || 'unhandledError_userLogs-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('userLogs').select().eq('userLogID', logID);

      if (error) {
        throw errorGen(`Error getting log: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`Got log with ID: ${log[0].logID}`, level:6, timestamp: new Date().toISOString(), 'userID': log[0].userID});
      return log;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in userLogs getByID', err.code || 520, err.name || 'unhandledError_userLogs-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('userLogs').insert({ userLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        throw errorGen(`Error creating userLog: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      return {
        userLogID: log.userLogID,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in userLogs create', err.code || 520, err.name || 'unhandledError_userLogs-create', err.isOperational || false, err.severity || 2);
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
