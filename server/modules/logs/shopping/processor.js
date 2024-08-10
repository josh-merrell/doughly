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
        throw errorGen(`*shoppingLogs-getAll* Error getting logs: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*shoppingLogs-getAll* Got ${logs.length} shopping logs`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return logs;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLogs-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLogs-getAll', err.isOperational || false, err.severity || 2);
    }
  }

  async function getShoppingListByID(options) {
    const { logID } = options;

    try {
      const { data: log, error } = await db.from('shoppingLogs').select().eq('shoppingLogID', logID);

      if (error) {
        throw errorGen(`*shoppingLogs-getShoppingListByID* Error getting log: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*shoppingLogs-getShoppingListByID* Got log with ID: ${log[0].logID}`, level:6, timestamp: new Date().toISOString(), 'userID': log[0].userID});
      return log;
    } catch (err) {
      throw errorGen(err.message || '*shoppingLogs-getShoppingListByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLogs-getShoppingListByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;

    try {
      const logTime = new Date().toISOString();

      const { data: log, error } = await db.from('shoppingLogs').insert({ shoppingLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

      if (error) {
        throw errorGen(`*shoppingLogs-create* Error creating shoppingLog: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      }
      return {
        shoppingLogID: log.shoppingLogID,
      };
    } catch (err) {
      throw errorGen(err.message || '*shoppingLogs-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_shoppingLogs-create', err.isOperational || false, err.severity || 2);
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
