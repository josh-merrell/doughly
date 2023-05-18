'use strict';

async function getClients(req, res) {
  const db = req.client.db;
  const processor = require('./index');
  ({ db });
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

module.exports = {
  getClients,
};
