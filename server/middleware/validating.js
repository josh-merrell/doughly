const Ajv = require('ajv');
const ajv = new Ajv();

function routeValidator(schema, location = 'body') {
  return (req, res, next) => {
    const dataToValidate = location === 'query' ? req.query : req.body;
    const valid = ajv.validate(schema, dataToValidate);
    if (!valid) {
      return res.status(422).json(ajv.errors);
    }
    next();
  };
}

module.exports = { routeValidator };
