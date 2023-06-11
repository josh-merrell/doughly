'use strict';

async function getClients(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { clientIDs, nameFirst, nameLast, phone, city, state, zip } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
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

async function getClientByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { clientID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, clientID });
  return res.json(returner);
}

async function createClient(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = req.body;
  const returner = await p.create({
    userID: req.userID,
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
    userID: req.userID,
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
  const returner = await p.delete({ userID: req.userID, clientID });
  return res.json(returner);
}

module.exports = {
  getClients,
  getClientByID,
  createClient,
  updateClient,
  deleteClient,
};
