/* eslint-disable prettier/prettier */

const axios = require('axios');

'use strict';

module.exports = ({ db }) => {
  async function getAll(options) {
    const { limit, clientIDs, nameFirst, nameLast, phone, city, state, zip } = options;
    const personIDs = [];
    //if filtering by clientIDs, need to get the personID for each clientID
    if (clientIDs) {
      for (const clientID of clientIDs) {
        const { data, error } = await db
          .from('clients')
          .select('personID')
          .eq('clientID', clientID)
          .single();

        if (error) {
          global.logger.info(`Error getting personID from clients table ${clientID}: ${error.message}`);
          return { error: error.message };
        } else {
          if (data) personIDs.push(data.personID);
        }
      }
    } else {
      //otherwise, need to just add all personIDs that exist in clients table to the array
      const { data, error } = await db.from('clients').select('personID');
      if (error) {
        global.logger.info(`Error getting all personIDs from clients table: ${error.message}`);
        return { error: error.message };
      }
      for (const client of data) {
        personIDs.push(client.personID);
      }
    }

    //make call to GET /persons. If clientIDs exists, provide the personIDs as a filter, otherwise just send other filters
    const queryParams = {
      limit,
      nameFirst,
      nameLast,
      phone,
      city,
      state,
      zip,
    }
    queryParams.personIDs = personIDs.join(',');
    let { data, error } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/persons`, {
      params: queryParams,
    });

    if (error) {
      global.logger.info(`Error getting clients: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Got clients`);
      return data;
    }
  }

  async function getClientByID(options) {
    const { data, error } = await db.from('clients').select().eq('clientID', options.clientID).single();
    if (error) {
      global.logger.info(`Error getting client by ID: ${options.clientID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    //attempt to create a new person
    let person = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/persons`, options);
    person = person.data;

    //if successful, record timestamp and create the client mapping with the new personID
    if (person.personID) {
      const { data, error } = await db
        .from('clients')
        .insert({
          personID: person.personID,
          createdTime: new Date().toISOString(),
        })
        .select('clientID');

      if (error) {
        global.logger.info(`Error creating client: ${error.message}`);
        //delete the person that was just created
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${person.personID}`);
        return { error: error.message };
      } else {
        global.logger.info(`Created client ${data[0].clientID}`);
        return data;
      }
    } else {
      global.logger.info(`Error creating person while trying to create client: ${person.error}`);
      return { error: person.error };
    }
  }

  async function update(options) {
    const { clientID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = options;

    //get the personID for the client
    const { data, error } = await db
      .from('clients')
      .select('personID')
      .eq('clientID', clientID)
      .single();

    if (error) {
      global.logger.info(`Error getting personID for clientID ${clientID}: ${error.message}`);
      return { error: error.message };
    } else {
      //call the PATCH /persons/{personID} endpoint
      const personID = data.personID;
      const { data: person, error: personError } = await axios.patch(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${personID}`, {
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

      if (personError) {
        global.logger.info(`Error updating person ${personID} while trying to update client ${clientID}: ${personError.message}`);
        return { error: personError.message };
      } else {
        global.logger.info(`Updated person ${personID} while updating client ${clientID}`);
        person.clientID = clientID;
        return person;
      }
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
        ID: existsByClientID,
      },
    },
    get: {
      by: {
        clientID: getClientByID,
      },
      all: getAll,
    },
  };
};
