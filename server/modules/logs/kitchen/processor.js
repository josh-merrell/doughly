('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, eventType, createdAfter, createdBefore } = options;
    let q = db.from('kitchenLogs').select().filter('userID', 'eq', userID).order('kitchenLogID', { ascending: true });
    if (logIDs) {
      q = q.in('kitchenLogID', logIDs);
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
    global.logger.info(`Got ${logs.length} kitchen logs`);
    return logs;
  }

  async function getByID(options) {
    const { logID } = options;
    const { data: log, error } = await db.from('kitchenLogs').select().eq('kitchenLogID', logID);

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
    const { data: log, error } = await db.from('kitchenLogs').insert({ kitchenLogID: customID, userID, subjectID, associatedID, eventType, oldValue, newValue, message, logTime }).select('*').single();

    if (error) {
      global.logger.info(`Error creating kitchenLog: ${error.message}`);
      return { kitchenLogID: 0, error: error.message };
    }
    return {
      kitchenLogID: log.kitchenLogID,
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
