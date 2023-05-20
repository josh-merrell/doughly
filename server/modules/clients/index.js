/* eslint-disable prettier/prettier */

const axios = require('axios');

'use strict';

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { limit, clientIDs, firstName, lastName, phone, city, state } = options;

    let q = await db
      .from('clients')
      .select()
      .order('clientID', { ascending: true })
      .limit(limit)
      // .offset(cursor);

    if (clientIDs) { q = q.in('clientID', clientIDs) }
    if (firstName) { q = q.like('firstName', firstName) }
    if (lastName) { q = q.like('lastName', lastName) }
    if (phone) { q = q.like('phone', phone) }
    if (city) { q = q.like('city', city) }
    if (state) { q = q.like('state', state) }

    const { data, error } = await q;

    if (error) {
      global.logger.info(`Error getting clients: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Got clients`);
      return data;
    }
  }

  async function create(options) {
    //attempt to create a new person
    let person = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/persons`, options);
    person = person.data;

    //if successful, record timestamp and create the client mapping with the new personID
    if (person.personID) {
      const { data: newClient, error: newClientError } = await db
        .from('clients')
        .insert({
          personID: person.personID,
          createdTime: new Date().toISOString(),
        })
        .select('clientID');

      if (newClientError) {
        global.logger.info(`Error creating client: ${newClientError.message}`);
        //delete the person that was just created
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${person.personID}`);
        return { error: newClientError.message };
      } else {
        global.logger.info(`Created client ${newClient.clientID}`);
        return newClient;
      }
    } else {
      global.logger.info(`Error creating person while trying to create client: ${person.error}`);
      return { error: person.error };
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

  async function deleteClient(options) {
    const { data, error } = await db.from('clients').delete().match({ clientID: options.clientID });

    if (error) {
      global.logger.info(`Error deleting client ${options.clientID}: ${error.message}`);
      return { error: error.message };
    }

    return data;
  }

  async function existsByClientID(options) {
    const { data, error } = await db.from('clients').select('clientID').match({ clientID: options.clientID });

    if (error) {
      global.logger.info(`Error checking if client ${options.clientID} exists: ${error.message}`);
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
