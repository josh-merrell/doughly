/* eslint-disable prettier/prettier */

const axios = require('axios');


'use strict';

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { personIDs, nameFirst, nameLast, phone, city, state, zip } = options;

    let q = db
      .from('persons')
      .select()
      .order('personID', { ascending: true })
      // .limit(limit)
      // .offset(cursor);

    if (personIDs) { q = q.in('personID', personIDs) }
    if (nameFirst) { q = q.like('nameFirst', nameFirst); }
    if (nameLast) { q = q.like('nameLast', nameLast); }
    if (phone) { q = q.like('phone', phone) }
    if (city) { q = q.like('city', city) }
    if (state) { q = q.like('state', state) }
    if (zip) { q = q.like('zip', zip) }

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
    const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = options;

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
        nameFirst, nameLast, email, phone, address1, address2, city, state, zip })
      .select('personID');

    if (error) {
      global.logger.info(`Error creating person ${nameFirst} ${nameLast}: ${error.message}`);
      return { error: error.message };
    } else {
      global.logger.info(`Created person ${nameFirst} ${nameLast}, ID ${data[0].personID}`);
      return data[0];
    }
  }

  async function update(options) {
    const updateFields = {};
    for (const key in options) {
      if (key !== 'personID' && options[key]) {
        updateFields[key] = options[key];
      }
    }
    //if email is being updated, make sure the new email is not already in use. If so, return an error.
    if (updateFields.email) {
      const { data: emailExists, error: emailExistsError } = await db
        .from('persons')
        .select('email')
        .match({ email: updateFields.email });

      if (emailExistsError) {
        global.logger.info(`Error checking if email ${updateFields.email} exists: ${emailExistsError.message}`);
        return { error: emailExistsError.message };
      } else if (emailExists.length > 0) {
        global.logger.info(`Email ${updateFields.email} already exists`);
        return { error: `Email ${updateFields.email} already exists` };
      }
    }

    //if the email is unique, update provided fields in the 'persons' table,
    try {
      const updatedPerson = await updater('personID', options.personID, 'persons', updateFields)
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

    //if the person exists, delete the person from the 'persons' table,
    let { data, error } = await db.from('persons').delete().eq( 'personID', options.personID );
    if (error) {
      global.logger.info(`Error deleting personID: ${options.personID}: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted personID: ${options.personID}`);
    return data;
  }

  async function existsByPersonID(options) {
    const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
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
