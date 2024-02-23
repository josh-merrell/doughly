'use strict';

async function getClients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { clientIDs, nameFirst, nameLast, phone, city, state, zip } = req.query;
  const returner = await p.get.all({
    cursor,
    limit,
    clientIDs,
    nameFirst,
    nameLast,
    phone,
    city,
    state,
    zip,
  });
  return res.json(returner);
}

async function createClient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = req.body;
  const returner = await p.create({
    nameFirst,
    nameLast,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
  });
  return res.json(returner);
}

async function updateClient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { clientID } = req.params;
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = req.body;
  const returner = await p.update({
    clientID,
    nameFirst,
    nameLast,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
  });
  return res.json(returner);
}

async function deleteClient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { clientID } = req.params;
  const returner = await p.delete({ clientID });
  return res.json(returner);
}

module.exports = {
  getClients,
  createClient,
  updateClient,
  deleteClient,
};
