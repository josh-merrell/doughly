'use strict';

async function getEmployees(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { cursor, limit } = req.query;
  const { employeeIDs, personID, hireDateRange, payPerHourRange, position, status, email, nameFirst, nameLast, phone, city, state, zip } = req.query;
  const returner = await p.get.all({
    userID: req.userID,
    cursor,
    limit,
    employeeIDs,
    personID,
    hireDateRange,
    payPerHourRange,
    position,
    status,
    email,
    nameFirst,
    nameLast,
    phone,
    city,
    state,
    zip,
  });
  return res.json(returner);
}

async function getEmployeeByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { employeeID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, employeeID });
  return res.json(returner);
}

async function createEmployee(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip, hireDate, position, status, payPerHour } = req.body;
  const returner = await p.create({
    userID: req.userID,
    nameFirst,
    nameLast,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
    hireDate,
    position,
    status,
    payPerHour,
  });
  return res.json(returner);
}

async function updateEmployee(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { employeeID } = req.params;
  const { nameFirst, nameLast, email, phone, address1, address2, city, state, zip, hireDate, position, status, payPerHour } = req.body;
  const returner = await p.update({
    userID: req.userID,
    employeeID,
    nameFirst,
    nameLast,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
    hireDate,
    position,
    status,
    payPerHour,
  });
  return res.json(returner);
}

async function deleteEmployee(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { employeeID } = req.params;
  const returner = await p.delete({ userID: req.userID, employeeID });
  return res.json(returner);
}

module.exports = {
  getEmployees,
  getEmployeeByID,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
