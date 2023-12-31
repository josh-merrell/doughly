/* eslint-disable prettier/prettier */
const { errorGen } = require('../../middleware/errorHandling');
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
      global.logger.error(`Error getting persons: ${error.message}`);
      throw errorGen('Error getting persons', 400);
    }
    global.logger.info(`Got ${persons.length} persons`);
    return persons;
  }

  async function create(options) {
    const { customID, authorization, userID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = options;

    //make sure the email is not already in use. If so, return an error.
    const { data: emailExists, error: emailExistsError } = await db.from('persons').select('email').eq('email', email);

    if (emailExistsError) {
      global.logger.error(`Error checking whether email ${email} exists: ${emailExistsError.message}`);
      throw errorGen(`Error checking whether email ${email} exists`, 400);
    } else if (emailExists.length > 0) {
      global.logger.error(`Email ${email} already exists`);
      throw errorGen(`Email ${email} already exists`, 400);
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
      global.logger.error(`Error creating person ${nameFirst} ${nameLast}: ${error.message}`);
      throw errorGen(`Error creating person ${nameFirst} ${nameLast}`, 400);
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
        global.logger.error(`Error checking whether email ${updateFields.email} exists: ${emailExistsError.message}`);
        throw errorGen(`Error checking whether email ${updateFields.email} exists`, 400);
      } else if (emailExists.length > 0) {
        global.logger.error(`Email ${updateFields.email} already exists`);
        throw errorGen(`Email ${updateFields.email} already exists`, 400);
      }
    }

    //if the email is unique, update provided fields in the 'persons' table,
    try {
      const updatedPerson = await updater(options.userID, options.authorization, 'personID', options.personID, 'persons', updateFields);
      return updatedPerson;
    } catch (error) {
      global.logger.error(`Error updating person ID:${options.personID}: ${error.message}`);
      throw errorGen(`Error updating person ID:${options.personID}`, 400);
    }
  }

  async function deletePerson(options) {
    //verify that the person to delete exists
    const { data: personExists, error: personExistsError } = await db.from('persons').select().match({ personID: options.personID }).single();

    if (personExistsError) {
      global.logger.error(`Error checking whether personID to del: ${options.personID} exists: ${personExistsError.message}`);
      throw errorGen(`Error checking whether personID to del: ${options.personID} exists`, 400);
    } else if (!personExists) {
      global.logger.error(`Person to delete ${options.personID} does not exist`);
      throw errorGen(`Person to delete ${options.personID} does not exist`, 400);
    }

    //if the person exists, delete the person from the 'persons' table,
    let { data, error } = await db.from('persons').update({ deleted: true }).eq('personID', options.personID);
    if (error) {
      global.logger.error(`Error deleting personID: ${options.personID}: ${error.message}`);
      throw errorGen(`Error deleting personID: ${options.personID}`, 400);
    }

    //add a 'deleted' log entry
    createUserLog(options.userID, options.authorization, 'deletePerson', Number(options.personID), null, null, null, `deleted Person, ${personExists.nameFirst} ${personExists.nameLast}, ${personExists.email}`);
    return data;
  }

  async function getPersonByID(options) {
    const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
    if (error) {
      global.logger.error(`Error getting person by ID:${options.personID}: ${error.message}`);
      throw errorGen(`Error getting person by ID:${options.personID}`, 400);
    }
    return data;
  }

  async function existsByPersonID(options) {
    const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
    if (error) {
      global.logger.error(`Error checking whether person ${options.personID} exists: ${error.message}`);
      throw errorGen(`Error checking whether person ${options.personID} exists`, 400);
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
