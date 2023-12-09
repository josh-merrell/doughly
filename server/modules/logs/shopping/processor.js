('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;
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
      global.logger.info(`Error getting logs: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${logs.length} shopping logs`);
    return logs;
  }

  async function getShoppingListByID(options) {
    const { logID } = options;
    const { data: log, error } = await db.from('shoppingLogs').select().eq('shoppingLogID', logID);

    if (error) {
      global.logger.info(`Error getting log: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got log`);
    return log;
  }

  async function create(options) {
    const { customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message } = options;
    const logTime = new Date().toISOString();

    const { data: log, error } = await db.from('shoppingLogs').insert({ shoppingLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

    if (error) {
      global.logger.info(`Error creating shoppingLog: ${error.message}`);
      return { error: error.message };
    }
    return {
      shoppingLogID: log.shoppingLogID,
    };
  }

  return {
    get: {
      all: getAll,
      byID: getShoppingListByID,
    },
    create,
  };
};
