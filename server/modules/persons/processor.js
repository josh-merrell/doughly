/* eslint-disable prettier/prettier */

const { createUserLog } = require('../../services/dbLogger');

('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, personIDs, nameFirst, nameLast, phone, city, state, zip } = options;

    let q = db.from('persons').select().filter('userID', 'eq', userID).eq('deleted', false).order('personID', { ascending: true });
    // .limit(limit)
    // .offset(cursor);

    if (personIDs) {
      q = q.in('personID', personIDs);
    }
    if (nameFirst) {
      q = q.like('nameFirst', nameFirst);
    }
    if (nameLast) {
      q = q.like('nameLast', nameLast);
    }
    if (phone) {
      q = q.like('phone', phone);
    }
    if (city) {
      q = q.like('city', city);
    }
    if (state) {
      q = q.filter('state', 'eq', state);
    }
    if (zip) {
      q = q.like('zip', zip);
    }

    const { data: persons, error } = await q;

    if (error) {
      global.logger.info(`Error getting persons: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${persons.length} persons`);
    return persons;
  }

  async function create(options) {
    const { customID, authorization, userID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = options;

    //make sure the email is not already in use. If so, return an error.
    const { data: emailExists, error: emailExistsError } = await db.from('persons').select('email').eq('email', email);

    if (emailExistsError) {
      global.logger.info(`Error checking whether email ${email} exists: ${emailExistsError.message}`);
      return { error: emailExistsError.message };
    } else if (emailExists.length > 0) {
      global.logger.info(`Email ${email} already exists`);
      return { error: `Email ${email} already exists` };
    }

    //if the email is new, add the new person to the 'persons' table,
    const { data, error } = await db
      .from('persons')
      .insert({
        personID: customID,
        userID,
        nameFirst,
        nameLast,
        email,
        phone,
        address1,
        address2,
        city,
        state,
        zip,
        version: 1,
      })
      .select()
      .single();

    if (error) {
      global.logger.info(`Error creating person ${nameFirst} ${nameLast}: ${error.message}`);
      return { error: error.message };
    } else {
      //add a 'created' log entry
      createUserLog(userID, authorization, 'createPerson', data.personID, null, null, null, `created Person: ${data.nameFirst} ${data.nameLast}, ${data.email}`);
      return data;
    }
  }

  async function update(options) {
    const updateFields = {};
    for (let key in options) {
      if (key !== 'personID' && options[key] !== undefined && key !== 'authorization') {
        updateFields[key] = options[key];
      }
    }
    //if email is being updated, make sure the new email is not already in use. If so, return an error.
    if (updateFields.email) {
      const { data: emailExists, error: emailExistsError } = await db.from('persons').select('email', 'version').match({ email: updateFields.email });

      if (emailExistsError) {
        global.logger.info(`Error checking whether email ${updateFields.email} exists: ${emailExistsError.message}`);
        return { error: emailExistsError.message };
      } else if (emailExists.length > 0) {
        global.logger.info(`Email ${updateFields.email} already exists`);
        return { error: `Email ${updateFields.email} already exists` };
      }
    }

    //if the email is unique, update provided fields in the 'persons' table,
    try {
      const updatedPerson = await updater(options.userID, options.authorization, 'personID', options.personID, 'persons', updateFields);
      // //increment version of person
      // const newVersion = await incrementVersion('persons', 'personID', options.personID, updatedPerson.version);
      // //add an 'updated' log entry
      // createUserLog(options.userID, options.authorization, 'updatedPersonVersion', Number(options.personID), null, String(updatedPerson.version), String(newVersion), `Updated Person, ID: ${options.personID}, new version: ${newVersion}`);
      return updatedPerson;
    } catch (error) {
      global.logger.info(`Error updating persons ID:${options.personID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deletePerson(options) {
    //verify that the person to delete exists
    const { data: personExists, error: personExistsError } = await db.from('persons').select().match({ personID: options.personID }).single();

    if (personExistsError) {
      global.logger.info(`Error checking whether personID to del: ${options.personID} exists: ${personExistsError.message}`);
      return { error: personExistsError.message };
    } else if (!personExists) {
      global.logger.info(`Person to delete ${options.personID} does not exist`);
      return { error: `Person to delete ${options.personID} does not exist` };
    }

    //if the person exists, delete the person from the 'persons' table,
    let { data, error } = await db.from('persons').update({ deleted: true }).eq('personID', options.personID);
    if (error) {
      global.logger.info(`Error deleting personID: ${options.personID}: ${error.message}`);
      return { error: error.message };
    }

    //add a 'deleted' log entry
    createUserLog(options.userID, options.authorization, 'deletePerson', Number(options.personID), null, null, null, `deleted Person, ${personExists.nameFirst} ${personExists.nameLast}, ${personExists.email}`);
    return data;
  }

  async function getPersonByID(options) {
    const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
    if (error) {
      global.logger.info(`Error getting person by ID:${options.personID}: ${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function existsByPersonID(options) {
    const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });

    if (error) {
      global.logger.info(`Error checking whether person ${options.personID} exists: ${error.message}`);
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
        ID: existsByPersonID,
      },
    },
    get: {
      by: {
        personID: getPersonByID,
      },
      all: getAll,
    },
  };
};
