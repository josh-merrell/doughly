const getEmployeesSchema_query = {
  type: 'object',
  properties: {
    employeeIDs: { type: 'array', items: { type: 'integer' } },
    personID: { type: 'string' },
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    position: { type: 'string' },
    status: { type: 'string', enum: ['active', 'inactive', 'leave'] },
    email: { type: 'string' },
    phone: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
    hireDateRange: { type: 'array', items: { type: 'string' }, description: 'Range of dates in format YYYY-MM-DD' },
    payPerHourRange: { type: 'array', items: { type: 'number' } },
  },
};

const getEmployeeSchema_params = {
  type: 'object',
  required: ['employeeID'],
  properties: {
    employeeID: { type: 'string' },
  },
};

const newEmployeeSchema_body = {
  type: 'object',
  required: ['payPerHour', 'phone', 'address1', 'city', 'state', 'zip', 'nameFirst', 'nameLast', 'email', 'position', 'hireDate'],
  properties: {
    payPerHour: { type: 'number' },
    phone: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    position: { type: 'string' },
    hireDate: { type: 'string', description: 'Date in format YYYY-MM-DD' },
    status: { type: 'string', enum: ['active', 'inactive', 'leave'] },
  },
};

const employeeUpdateSchema_body = {
  type: 'object',
  properties: {
    payPerHour: { type: 'number' },
    hireDate: { type: 'string', description: 'Date in format YYYY-MM-DD' },
    status: { type: 'string', enum: ['active', 'inactive', 'leave'] },
    position: { type: 'string' },
    nameFirst: { type: 'string' },
    nameLast: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    address1: { type: 'string' },
    address2: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
  },
};

const employeeUpdateSchema_params = {
  type: 'object',
  required: ['employeeID'],
  properties: {
    employeeID: { type: 'string' },
  },
};

const employeeDeleteSchema_params = {
  type: 'object',
  required: ['employeeID'],
  properties: {
    employeeID: { type: 'string' },
  },
};

module.exports = {
  getEmployeesSchema_query,
  getEmployeeSchema_params,
  newEmployeeSchema_body,
  employeeUpdateSchema_body,
  employeeUpdateSchema_params,
  employeeDeleteSchema_params,
};
