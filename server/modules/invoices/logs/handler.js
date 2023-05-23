'use strict';

async function getInvoiceLogs(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { invoiceLogIDs, invoiceID, type, dateRange } = req.query;
  const returner = await p.get.all({
    cursor,
    limit,
    invoiceLogIDs,
    invoiceID,
    type,
    dateRange,
  });
  return res.json(returner);
}

async function createInvoiceLog(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { invoiceID } = req.params;
  const { log, type } = req.body;
  const returner = await p.create({
    invoiceID,
    log,
    type,
  });
  return res.json(returner);
}

module.exports = {
  getInvoiceLogs,
  createInvoiceLog,
};
