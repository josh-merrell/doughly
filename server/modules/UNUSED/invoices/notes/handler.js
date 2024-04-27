'use strict';

async function getInvoiceNotes(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { invoiceNoteIDs, invoiceID } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    cursor,
    limit,
    invoiceNoteIDs,
    invoiceID,
  });
  return res.json(returner);
}

async function createInvoiceNote(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { invoiceID } = req.params;
  const { note } = req.body;
  const { customID } = req;
  const returner = await p.create({
    customID,
    userID: req.userID,
    invoiceID,
    note,
  });
  return res.json(returner);
}

module.exports = {
  getInvoiceNotes,
  createInvoiceNote,
};
