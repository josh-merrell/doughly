('use strict');

module.exports = ({ db }) => {
  async function create(options) {
    const { invoiceID, log, type } = options;

    const { data: invoice, error } = await db.from('invoiceLogs').insert({ invoiceID, log, type, createdTime: new Date().toISOString() }).select('invoiceLogID').single();

    if (error) {
      global.logger.info(`Error creating invoice log: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Created invoice log ${invoice.invoiceLogID}`);
    return invoice;
  }

  async function getAll(options) {
    const { invoiceLogIDs, invoiceID, type, dateRange } = options;

    let q = db.from('invoiceLogs').select().order('invoiceLogID', { ascending: true });
    if (invoiceLogIDs) {
      q = q.in('invoiceLogID', invoiceLogIDs);
    }
    if (invoiceID) {
      q = q.eq('invoiceID', invoiceID);
    }
    if (type) {
      q = q.eq('type', type);
    }
    //if dateRange is provided, filter by dateRange where dateRange[0] is a string of the start date and dateRange[1] is a string of the end date. The table cell is a timestamp.
    if (dateRange) {
      q = q.gte('createdTime', dateRange[0]).lte('createdTime', dateRange[1]);
    }

    const { data: logs, error } = await q;
    if (error) {
      global.logger.info(`Error getting logs: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${logs.length} invoice logs`);
    return logs;
  }

  return {
    get: {
      all: getAll,
    },
    create,
  };
};
