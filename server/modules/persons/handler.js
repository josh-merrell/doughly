'use strict';

async function getPersons(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { personIDs, nameFirst, nameLast, phone, city, state, zip } = req.query;
  try {
    const returner = await p.get.all({
      userID: req.userID,
      cursor,
      limit,
      personIDs,
      nameFirst,
      nameLast,
      phone,
      city,
      state,
      zip,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'persons' 'getPersons': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function getPersonByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { personID } = req.params;
  try {
    const returner = await p.exists.by.ID({
      userID: req.userID,
      personID,
    });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'persons' 'getPersonByID': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function createPerson(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = req.body;
  const { authorization } = req.headers;
  const { customID } = req;
  try {
    const returner = await p.create({
      customID,
      authorization,
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
  } catch (e) {
    global.logger.error(`'persons' 'createPerson': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function updatePerson(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { personID } = req.params;
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = req.body;
  const { authorization } = req.headers;
  try {
    const returner = await p.update({
      userID: req.userID,
      authorization,
      personID,
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
  } catch (e) {
    global.logger.error(`'persons' 'updatePerson': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

async function deletePerson(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { personID } = req.params;
  const { authorization } = req.headers;
  try {
    const returner = await p.delete({ authorization, userID: req.userID, personID });
    return res.json(returner);
  } catch (e) {
    global.logger.error(`'persons' 'deletePerson': ${e.message}`);
    return res.status(e.code || 500).json({ error: e.message });
  }
}

module.exports = {
  getPersons,
  getPersonByID,
  createPerson,
  deletePerson,
  updatePerson,
};
