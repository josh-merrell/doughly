'use strict';

async function getClients(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { cursor, limit } = req.query;
  const { clientIDs, firstName, lastName, phone, city, state } = req.query;
  const returner = await processor.get.all({
    cursor,
    limit,
    clientIDs,
    firstName,
    lastName,
    phone,
    city,
    state,
  });
  return res.json(returner);
}

async function createClient(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { firstName, lastName, email, phone, address1, address2, city, state } = req.body;
  const returner = await processor.create({
    firstName,
    lastName,
    email,
    phone,
    address1,
    address2,
    city,
    state,
  });
  return res.json(returner);
}

async function deleteClient(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { clientID } = req.params;
  const returner = await processor.delete({ clientID });
  return res.json(returner);
}

module.exports = {
  getClients,
  createClient,
  deleteClient,
};
