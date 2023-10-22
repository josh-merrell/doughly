('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, logIDs, subjectID, category, eventType, createdAfter, createdBefore } = options;
    let q = db.from('activityLogs').select().filter('userID', 'eq', userID).order('logID', { ascending: true });
    if (logIDs) {
      q = q.in('logID', logIDs);
    }
    if (subjectID) {
      q = q.filter('subjectID', 'eq', subjectID);
    }
    if (category) {
      q = q.like('category', category);
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
    global.logger.info(`Got ${logs.length} logs`);
    return logs;
  }

  async function getByID(options) {
    const { logID } = options;
    const { data: log, error } = await db.from('activityLogs').select().eq('logID', logID);

    if (error) {
      global.logger.info(`Error getting log: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got log`);
    return log;
  }

  async function create(options) {
    const { customID, userID, subjectID, category, eventType, resultValue } = options;
    const createdTime = new Date().toISOString();

    const { data: log, error } = await db.from('activityLogs').insert({ logID: customID, userID, subjectID, category, eventType, resultValue, createdTime }).select('*').single();

    if (error) {
      global.logger.info(`Error creating log: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created log`);
    return {
      logID: log.logID,
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
