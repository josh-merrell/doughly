('use strict');

const axios = require('axios');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { authorization, userID, employeeIDs, personID, hireDateRange, payPerHourRange, position, status, email, nameFirst, nameLast, phone, city, state, zip } = options;

    const personIDs = [];
    //if filtering by employeeIDs, need to get the personID for each employeeID
    if (personID) personIDs.push(personID);
    else if (employeeIDs) {
      for (const employeeID of employeeIDs) {
        const { data, error } = await db.from('employees').select('personID').filter('userID', 'eq', userID).filter('employeeID', 'eq', employeeID).eq('deleted', false);

        if (error) {
          global.logger.info(`Error getting personID from employees table ${employeeID}: ${error.message}`);
          return { error: error.message };
        } else {
          if (data[0]) personIDs.push(data[0].personID);
        }
      }
    } else {
      //otherwise, need to just add all personIDs that exist in employees table to the array
      const { data, error } = await db.from('employees').select('personID').eq('userID', userID).eq('deleted', false);
      if (error) {
        global.logger.info(`Error getting all personIDs from employees table: ${error.message}`);
        return { error: error.message };
      }
      for (const employee of data) {
        personIDs.push(employee.personID);
      }
    }

    //collect persons data first, using query params relevent to the table. Then, collect employees data using the personIDs and join the two before returning
    const queryParams = {
      userID,
      limit: options.limit,
      nameFirst,
      nameLast,
      phone,
      city,
      state,
      zip,
      email,
    };
    queryParams.personIDs = personIDs.join(',');
    let { data: employeePersons, error } = await axios.get(`${process.env.NODE_HOST}:${process.env.PORT}/persons`, {
      params: queryParams,
      headers: {
        authorization: authorization,
      },
    });

    if (error) {
      global.logger.info(`Error getting employee persons: ${error.message}`);
      return { error: error.message };
    }
    if (!employeePersons.length) {
      global.logger.info(`No employee persons found that match the filters`);
      return `No employee persons found that match the filters`;
    }

    //start building the query to get employees data
    let q = db.from('employees').select().filter('userID', 'eq', userID).eq('deleted', false);

    if (employeeIDs) q = q.in('employeeID', employeeIDs);
    if (hireDateRange) q = q.gte('hireDate', hireDateRange[0]).lte('hireDate', hireDateRange[1]);
    if (payPerHourRange) q = q.gte('payPerHour', payPerHourRange[0]).lte('payPerHour', payPerHourRange[1]);
    if (position) q = q.like('position', position);
    if (status) q = q.filter('status', 'eq', status);
    if (personID) q = q.filter('personID', 'eq', personID);

    const { data: employees, error: employeesError } = await q;

    if (employeesError) {
      global.logger.info(`Error getting employees: ${employeesError.message}`);
      return { error: employeesError.message };
    }
    if (!employees.length) {
      global.logger.info(`No employees found that match the filters`);
      return `No employees found that match the filters`;
    }

    //join the two data sets
    const employeesWithMatchingPersons = [];
    for (const employee of employees) {
      let employeePersonFound = false;
      for (const person of employeePersons) {
        if (employee.personID === person.personID) {
          employee.nameFirst = person.nameFirst;
          employee.nameLast = person.nameLast;
          employee.phone = person.phone;
          employee.email = person.email;
          employee.city = person.city;
          employee.state = person.state;
          employee.zip = person.zip;
          employee.address1 = person.address1;
          employee.address2 = person.address2;
          employeePersonFound = true;
        }
      }
      if (employeePersonFound) {
        employeesWithMatchingPersons.push(employee);
      }
    }

    global.logger.info(`Retrieved ${employeesWithMatchingPersons.length} employees`);
    return employeesWithMatchingPersons;
  }

  async function getByID(options) {
    const { data, error } = await db.from('employees').select().eq('employeeID', options.employeeID).eq('deleted', false).single();

    if (error) {
      global.logger.info(`Error getting employee: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Retrieved employee ${options.employeeID}`);
    return data;
  }

  async function create(options) {
    const { authorization, userID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip, hireDate, position, status, payPerHour } = options;

    //validate that provided payPerHour is a positive number
    if (payPerHour <= 0) {
      global.logger.info(`Error creating employee: payPerHour must be a positive number`);
      return { error: 'payPerHour must be a positive number' };
    }

    //validate that provided hireDate is a valid date
    if (isNaN(Date.parse(hireDate))) {
      global.logger.info(`Error creating employee: hireDate must be a valid date`);
      return { error: 'hireDate must be a valid date' };
    }

    //if status is not provided, default to 'active'
    const statusToUse = status ? status : 'active';

    //attempt to create a person first
    let person = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/persons`,
      {
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
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    person = person.data;

    //if succsessful, create the employee
    if (person.personID) {
      const { data, error } = await db
        .from('employees')
        .insert({
          userID,
          personID: person.personID,
          hireDate,
          position,
          status: statusToUse,
          payPerHour,
        })
        .select('employeeID');

      if (error) {
        global.logger.info(`Error creating employee: ${error.message}`);
        //if employee creation fails, delete the person that was created
        await axios.delete(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${person.personID}`, {
          headers: {
            authorization: authorization,
          },
        });
        return { error: error.message };
      }
      global.logger.info(`Created employee ${person.personID}`);
      return data;
    } else {
      global.logger.info(`Error creating person while trying to create employee: ${person.error}`);
      return { error: person.error };
    }
  }

  async function update(options) {
    const { authorization, userID, employeeID, nameFirst, nameLast, email, phone, address1, address2, city, state, zip, hireDate, position, status, payPerHour } = options;

    //validate that provided employeeID exists
    const { data: employeeExists, error: employeeExistsError } = await db.from('employees').select().eq('employeeID', employeeID);
    if (employeeExistsError) {
      global.logger.info(`Error validating provided employee ID for update: ${employeeExistsError.message}`);
      return { error: employeeExistsError.message };
    }
    if (!employeeExists.length) {
      global.logger.info(`Error updating employee: employeeID ${employeeID} does not exist`);
      return { error: `employeeID ${employeeID} does not exist` };
    }

    //validate that provided payPerHour is a positive number
    if (payPerHour <= 0) {
      global.logger.info(`Error updating employee: payPerHour must be a positive number`);
      return { error: 'payPerHour must be a positive number' };
    }

    //validate that provided hireDate is a valid date
    if (hireDate && isNaN(Date.parse(hireDate))) {
      global.logger.info(`Error updating employee: hireDate must be a valid date`);
      return { error: 'hireDate must be a valid date' };
    }

    //if status is not provided, default to 'active'
    const statusToUse = status ? status : 'active';

    //attempt to update the person first
    const updatePersonFields = { userID };
    if (nameFirst) updatePersonFields.nameFirst = nameFirst;
    if (nameLast) updatePersonFields.nameLast = nameLast;
    if (email) updatePersonFields.email = email;
    if (phone) updatePersonFields.phone = phone;
    if (address1) updatePersonFields.address1 = address1;
    if (address2) updatePersonFields.address2 = address2;
    if (city) updatePersonFields.city = city;
    if (state) updatePersonFields.state = state;
    if (zip) updatePersonFields.zip = zip;

    const personID = employeeExists[0].personID;
    const { data: personUpdateResult } = await axios.patch(`${process.env.NODE_HOST}:${process.env.PORT}/persons/${personID}`, updatePersonFields, {
      headers: {
        authorization: authorization,
      },
    });

    if (personUpdateResult.error) {
      global.logger.info(`Error updating person while trying to update employee: ${personUpdateResult.error.message}`);
      return { error: personUpdateResult.error.message };
    }

    //if succsessful, update the employee
    const updateEmployeeFields = { userID };
    if (hireDate) updateEmployeeFields.hireDate = hireDate;
    if (position) updateEmployeeFields.position = position;
    if (status) updateEmployeeFields.status = statusToUse;
    if (payPerHour) updateEmployeeFields.payPerHour = payPerHour;

    try {
      const updatedEmployee = await updater('employeeID', employeeID, 'employees', updateEmployeeFields);
      global.logger.info(`Updated employee with ID:${employeeID}`);
      return updatedEmployee;
    } catch (error) {
      global.logger.info(`Error updating employee: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteEmployee(options) {
    const { employeeID } = options;
    //verify provided employeeID exists
    const { data: employeeExists, error: employeeExistsError } = await db.from('employees').select('employeeID').eq('employeeID', employeeID).eq('deleted', false);
    if (employeeExistsError) {
      global.logger.info(`Error validating provided employee ID for deletion: ${employeeExistsError.message}`);
      return { error: employeeExistsError.message };
    }
    if (!employeeExists.length) {
      global.logger.info(`Error deleting employee: employeeID ${employeeID} does not exist`);
      return { error: `employeeID ${employeeID} does not exist` };
    }
    const { error: employeeDeletedError } = await db.from('employees').update({ status: 'deleted' }).eq('employeeID', employeeID);
    if (employeeDeletedError) {
      global.logger.info(`Error deleting employee: ${employeeDeletedError.message}`);
      return { error: employeeDeletedError.message };
    }
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteEmployee,
  };
};
