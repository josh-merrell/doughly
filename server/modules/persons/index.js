/* eslint-disable prettier/prettier */

const axios = require('axios');


'use strict';

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { cursor, limit, personIDs, firstName, lastName, phone, city, state } = options;

    let q = await db
      .from('persons')
      .select()
      .order('person_id', { ascending: true })
      .limit(limit)
      // .offset(cursor);

    if (personIDs) { q = q.in('person_id', personIDs) }
    if (firstName) { q = q.like('firstName', firstName) }
    if (lastName) { q = q.like('lastName', lastName) }
    if (phone) { q = q.like('phone', phone) }
    if (city) { q = q.like('city', city) }
    if (state) { q = q.like('state', state) }

    const { data: persons, error } = await q;

    if (error) {
      global.logger.info(`Error getting persons: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Got persons`);
      return persons;
    }
  }

  async function create(options) {
    const { firstName, lastName, email, phone, address1, address2, city, state } = options;

    //if anything except phone and address_2 are missing, return an error
    if (!firstName || !lastName || !email || !address1 || !city || !state) {
      global.logger.info(`Missing required fields`);
      return { error: 'Missing required fields' };
    }

    //make sure the email is not already in use. If so, return an error.
    const { data: emailExists, error: emailExistsError } = await db
      .from('persons')
      .select('email')
      .match({ email: email });

    if (emailExistsError) {
      global.logger.info(`Error checking if email ${email} exists: ${emailExistsError.message}`);
      return { error: emailExistsError.message };
    } else if (emailExists.length > 0) {
      global.logger.info(`Email ${email} already exists`);
      return { error: `Email ${email} already exists` };
    }

    //if the email is new, add the new person to the 'persons' table, 
    const { data, error } = await db
      .from('persons')
      .insert({ 
        name_first: firstName, 
        name_last: lastName, email, phone, address_1: address1, address_2: address2, city, state })
      .select('person_id');

    if (error) {
      global.logger.info(`Error creating person ${firstName} ${lastName}: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Created person ${firstName} ${lastName}, ID ${data[0].person_id}`);
      return data[0];
    }
  }

  async function update(options) {
    const updateFields = {};
    for (const key in options) {
      if (key !== 'personID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedPerson = await updater('persons', updateFields, { personID: options.personID });
      global.logger.info(`Updated person ${options.personID}`);
      return updatedPerson;
    } catch (error) {
      global.logger.info(`Error updating persons ${options.personID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deletePerson(options) {
    //verify that the person to delete exists
    let { data: personExists, error: personExistsError } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${options.personID}`, options);

    if (personExistsError) {
      global.logger.info(`Error checking if personID to del: ${options.personID} exists: ${personExistsError.message}`);
      return { error: personExistsError.message };
    } else if (!personExists) {
      global.logger.info(`Person to delete ${options.personID} does not exist`);
      return { error: `Person to delete ${options.personID} does not exist` };
    }

    let { data, error } = await db.from('persons').delete().eq( 'person_id', options.personID );
    if (error) {
      global.logger.info(`Error deleting personID: ${options.personID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted personID: ${options.personID}`);
    return data;
  }

  async function existsByPersonID(options) {
    const { data, error } = await db.from('persons').select('person_id').match({ person_id: options.personID });
    if (error) {
      global.logger.info(`Error checking if personID: ${options.personID} exists: ${error.message}`);
      return { error: error.message };
    }
    
    return data.length > 0;
  }

  return {
    create,
    update,
    delete: deletePerson,
    exists: {
      by: {
        personID: existsByPersonID,
      },
    },
    get: {
      all: getAll,
    },
  };
};
