('use strict');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;

    try {
      let q = db.from('shoppingLogs').select().filter('userID', 'eq', userID).order('shoppingLogID', { ascending: true });
      if (logIDs) {
        q = q.in('shoppingLogID', logIDs);
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
      global.logger.info(`Got ${logs.length} shopping logs`);
      return logs;
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLogs getAll', 520, 'unhandledError_shoppingLogs-getAll', false, 2); //message, code, name, operational, severity
    }
  }

  async function getShoppingListByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('shoppingLogs').select().eq('shoppingLogID', logID);

      if (error) {
        global.logger.error(`Error getting log: ${error.message}`);
        throw errorGen(`Error getting log: ${error.message}`, 400);
      }
      global.logger.info(`Got log`);
      return log;
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLogs getShoppingListByID', 520, 'unhandledError_shoppingLogs-getShoppingListByID', false, 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('shoppingLogs').insert({ shoppingLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        global.logger.error(`Error creating shoppingLog: ${error.message}`);
        throw errorGen(`Error creating shoppingLog: ${error.message}`, 400);
      }
      return {
        shoppingLogID: log.shoppingLogID,
      };
    } catch (err) {
      throw errorGen('Unhandled Error in shoppingLogs create', 520, 'unhandledError_shoppingLogs-create', false, 2); //message, code, name, operational, severity
    }
  }

  return {
    get: {
      all: getAll,
      byID: getShoppingListByID,
    },
    create,
  };
};
