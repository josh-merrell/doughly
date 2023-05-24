'use strict';

async function getPayments(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { paymentIDs, method, invoiceID, dateRange } = req.query;
  const returner = await p.get.all({
    cursor,
    limit,
    paymentIDs,
    invoiceID,
    method,
    dateRange,
  });
  return res.json(returner);
}

async function createPayment(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { method, invoiceID, amount, receivedTime } = req.body;
  const returner = await p.create({
    method,
    invoiceID,
    amount,
    receivedTime,
  });
  return res.json(returner);
}

module.exports = {
  getPayments,
  createPayment,
};
