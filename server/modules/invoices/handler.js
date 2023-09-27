'use strict';

async function getInvoices(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { invoiceIDs, type, status, subtotalMin, subtotalMax } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    cursor,
    limit,
    invoiceIDs,
    type,
    status,
    subtotalMin,
    subtotalMax,
  });
  return res.json(returner);
}

async function createInvoice(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { type, status, subtotal } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    type,
    status,
    subtotal,
  });
  return res.json(returner);
}

async function updateInvoice(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { invoiceID } = req.params;
  const { status, subtotal } = req.body;
  const returner = await p.update({
    userID: req.userID,
    invoiceID,
    status,
    subtotal,
  });
  return res.json(returner);
}

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
};
