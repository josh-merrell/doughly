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
        global.logger.error(`Error getting logs: ${error.message}`);
        throw errorGen('Error getting logs', 400);
      }
      global.logger.info(`Got ${logs.length} user logs`);
      return logs;
    } catch (err) {
      throw errorGen('Unhandled Error in userLogs getAll', 520, 'unhandledError_userLogs-getAll', false, 2); //message, code, name, operational, severity
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('userLogs').select().eq('userLogID', logID);

      if (error) {
        global.logger.error(`Error getting log: ${error.message}`);
        throw errorGen(`Error getting log: ${error.message}`, 400);
      }
      global.logger.info(`Got log`);
      return log;
    } catch (err) {
      throw errorGen('Unhandled Error in userLogs getByID', 520, 'unhandledError_userLogs-getByID', false, 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('userLogs').insert({ userLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        global.logger.error(`Error creating userLog: ${error.message}`);
        throw errorGen(`Error creating userLog: ${error.message}`, 400);
      }
      return {
        userLogID: log.userLogID,
      };
    } catch (err) {
      throw errorGen('Unhandled Error in userLogs create', 520, 'unhandledError_userLogs-create', false, 2); //message, code, name, operational, severity
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
