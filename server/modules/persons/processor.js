/* eslint-disable prettier/prettier */
const { errorGen } = require('../../middleware/errorHandling');
const { createUserLog } = require('../../services/dbLogger');

('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, personIDs, nameFirst, nameLast, phone, city, state, zip } = options;

    try {
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
        throw errorGen(`*persons-getAll* Error getting persons: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      global.logger.info({message:`*persons-getAll* Got ${persons.length} persons`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return persons;
    } catch (err) {
      throw errorGen(err.message || '*persons-getAll* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-getAll', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    }
  }

  async function create(options) {
    const { customID, authorization, userID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip } = options;

    try {
      //make sure the email is not already in use. If so, return an error.
      const { data: emailExists, error: emailExistsError } = await db.from('persons').select('email').eq('email', email);

      if (emailExistsError) {
        throw errorGen(`*persons-create* Error checking whether email ${email} exists: ${emailExistsError.message}`, 511, 'failSupabaseSelect', true, 3);
      } else if (emailExists.length > 0) {
        throw errorGen(`*persons-create* Email ${email} already exists, cannot create`, 515, 'cannotComplete', false, 3);
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
        throw errorGen(`*persons-create* Error creating person ${nameFirst} ${nameLast}: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
      } else {
        //add a 'created' log entry
        createUserLog(userID, authorization, 'createPerson', data.personID, null, null, null, `created Person: ${data.nameFirst} ${data.nameLast}, ${data.email}`);
        return data;
      }
    } catch (err) {
      throw errorGen(err.message || '*persons-create* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-create', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    try {
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
          throw errorGen(`*persons-update* Error checking whether email ${updateFields.email} exists: ${emailExistsError.message}`, 511, 'failSupabaseSelect', true, 3);
        } else if (emailExists.length > 0) {
          throw errorGen(`*persons-update* Email ${updateFields.email} already exists, cannot update`, 515, 'cannotComplete', false, 3);
        }
      }

      //if the email is unique, update provided fields in the 'persons' table,
      const updatedPerson = await updater(options.userID, options.authorization, 'personID', options.personID, 'persons', updateFields);
      return updatedPerson;
    } catch (err) {
      throw errorGen(err.message || '*persons-update* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function deletePerson(options) {
    try {
      //verify that the person to delete exists
      const { data: personExists, error: personExistsError } = await db.from('persons').select().match({ personID: options.personID }).single();

      if (personExistsError) {
        throw errorGen(`*persons-deletePerson* Error checking whether personID to del: ${options.personID} exists: ${personExistsError.message}`, 511, 'failSupabaseSelect', true, 3);
      } else if (!personExists) {
        throw errorGen(`*persons-deletePerson* Person to delete ${options.personID} does not exist, cannot delete`, 515, 'cannotComplete', false, 3);
      }

      //if the person exists, delete the person from the 'persons' table,
      let { data, error } = await db.from('persons').update({ deleted: true }).eq('personID', options.personID);
      if (error) {
        throw errorGen(`*persons-deletePerson* Error deleting personID: ${options.personID}: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      //add a 'deleted' log entry
      createUserLog(options.userID, options.authorization, 'deletePerson', Number(options.personID), null, null, null, `deleted Person, ${personExists.nameFirst} ${personExists.nameLast}, ${personExists.email}`);
      return data;
    } catch (err) {
      throw errorGen(err.message || '*persons-deletePerson* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-deletePerson', err.isOperational || false, err.severity || 2);
    }
  }

  async function getPersonByID(options) {
    try {
      const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
      if (error) {
        throw errorGen(`*persons-getPersonByID* Error getting person by ID:${options.personID}: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      return data;
    } catch (err) {
      throw errorGen(err.message || '*persons-getPersonByID* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-getPersonByID', err.isOperational || false, err.severity || 2);
    }
  }

  async function existsByPersonID(options) {
    try {
      const { data, error } = await db.from('persons').select('personID').match({ personID: options.personID });
      if (error) {
        throw errorGen(`*persons-existsByPersonID* Error checking whether person ${options.personID} exists: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      return data.length > 0;
    } catch (err) {
      throw errorGen(err.message || '*persons-existsByPersonID* Unhandled Error', err.code || 520, err.name || 'unhandledError_persons-existsByPersonID', err.isOperational || false, err.severity || 2);
    }
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
