'use strict';

async function getPersons(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { cursor, limit } = req.query;
  const { personIDs, firstName, lastName, phone, city, state } = req.query;
  const returner = await processor.get.all({
    cursor,
    limit,
    personIDs,
    firstName,
    lastName,
    phone,
    city,
    state,
  });
  return res.json(returner);
}

async function getPersonByID(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { personID } = req.params;
  const returner = await processor.exists.by.personID({
    personID,
  });
  return res.json(returner);
}

async function createPerson(req, res) {
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

async function deletePerson(req, res) {
  const db = req.client.db;
  const processor = require('./index')({ db });
  const { personID } = req.params;
  const returner = await processor.delete({ personID });
  return res.json(returner);
}

module.exports = {
  getPersons,
  getPersonByID,
  createPerson,
  deletePerson,
};
