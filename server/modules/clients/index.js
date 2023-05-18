'use strict';

const db = require('../../db');
const SQL = db.requireSQL(`${__dirname}/sql`);
const updater = db.updater;

module.exports = ({ db }) => {
  async function getAll(options) {
    const { cursor, limit, clientIDs, firstName, lastName, phone, city, state } = options;
    let filter = clientIDs !== undefined ? ` AND c.clientID IN(${'?clientIDs?'})` : '';
    filter += firstName !== undefined ? ` AND c.firstName LIKE ${'?firstName?'}` : '';
    filter += lastName !== undefined ? ` AND c.lastName LIKE ${'?lastName?'}` : '';
    filter += phone !== undefined ? ` AND c.phone LIKE ${'?phone?'}` : '';
    filter += city !== undefined ? ` AND c.city LIKE ${'?city?'}` : '';
    filter += state !== undefined ? ` AND c.state LIKE ${'?state?'}` : '';

    const q = SQL.get.all.replace(/\{\{filter\}\}/gm, filter);
    const params = {
      cursor: cursor,
      limit: limit,
      clientIDs: clientIDs,
      firstName: `%${firstName}%`,
      lastName: `%${lastName}%`,
      phone: `%${phone}%`,
      city: `%${city}%`,
      state: `%${state}%`,
    };
    const { data, error } = await db.sql.raw(q, params);

    if (error) {
      global.logger.info(`Error getting clients: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Got clients`);
      return data;
    }
  }

  async function create(options) {
    const { clientID, firstName, lastName, email, phone, address_1, address_2, city, state } = options;

    const q = SQL.create;
    const params = {
      clientID: clientID,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      address_1: address_1,
      address_2: address_2,
      city: city,
      state: state,
    };
    const { data, error } = await db.sql.raw(q, params);

    if (error) {
      global.logger.info(`Error creating client: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Created client ${clientID}`);
      return data;
    }
  }

  async function update(options) {
    const updateFields = {};
    for (const key in options) {
      if (key !== 'clientID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedClient = await updater('clients', updateFields, { clientID: options.clientID });
      global.logger.info(`Updated client ${options.clientID}`);
      return updatedClient;
    } catch (error) {
      global.logger.info(`Error updating client ${options.clientID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteClient(clientID) {
    const { data, error } = await db.from('clients').delete().match({ clientID: clientID });

    if (error) {
      global.logger.info(`Error deleting client ${clientID}: ${error.message}`);
      return { error: error.message };
    }

    return data;
  }

  async function existsByClientID(clientID) {
    const { data, error } = await db.from('clients').select('clientID').match({ clientID: clientID });

    if (error) {
      global.logger.info(`Error checking if client ${clientID} exists: ${error.message}`);
      return { error: error.message };
    }

    return data.length > 0;
  }

  return {
    create,
    update,
    delete: deleteClient,
    exists: {
      by: {
        clientID: existsByClientID,
      },
    },
    get: {
      all: getAll,
    },
  };
};
