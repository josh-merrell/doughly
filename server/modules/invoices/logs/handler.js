'use strict';

async function getInvoiceLogs(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { invoiceLogIDs, invoiceID, type, dateRange } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
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
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
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
