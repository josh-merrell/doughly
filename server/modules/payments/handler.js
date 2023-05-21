'use strict';

async function getPayments(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { paymentIDs, type, status, subtotalMin, subtotalMax } = req.query;
  const returner = await p.get.all({
    cursor,
    limit,
    paymentIDs,
    type,
    status,
    subtotalMin,
    subtotalMax,
  });
  return res.json(returner);
}

async function createPayment(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { method, invoiceID, amount } = req.body;
  const returner = await p.create({
    method,
    invoiceID,
    amount,
  });
  return res.json(returner);
}

module.exports = {
  getPayments,
  createPayment,
};
