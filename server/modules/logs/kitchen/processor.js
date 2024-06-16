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
        global.logger.error(`Error getting logs: ${error.message}`);
        throw errorGen('Error getting logs', 400);
      }
      global.logger.info(`Got ${logs.length} kitchen logs`);
      return logs;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in kitchenLogs getAll', err.code || 520, err.name || 'unhandledError_kitchenLogs-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function getByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('kitchenLogs').select().eq('kitchenLogID', logID);

      if (error) {
        global.logger.error(`Error getting log: ${error.message}`);
        throw errorGen(`Error getting log: ${error.message}`, 400);
      }
      global.logger.info(`Got log`);
      return log;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in kitchenLogs getByID', err.code || 520, err.name || 'unhandledError_kitchenLogs-getByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();
      const { data: log, error } = await db.from('kitchenLogs').insert({ kitchenLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        global.logger.error(`Error creating kitchenLog: ${error.message}`);
        throw errorGen(`Error creating kitchenLog: ${error.message}`, 400);
      }
      return {
        kitchenLogID: log.kitchenLogID,
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in kitchenLogs create', err.code || 520, err.name || 'unhandledError_kitchenLogs-create', err.isOperational || false, err.severity || 2);
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
