const Ajv = require('ajv');
const ajv = new Ajv();

function routeValidator(schema, dataToValidate) {
  return (req, res, next) => {
    const data = req[dataToValidate];
    const valid = ajv.validate(schema, data);
    if (!valid) {
      global.logger.info(`Invalid data in request ${dataToValidate}: ${ajv.errorsText()}`);
      return res.status(422).json(ajv.errors);
    }
    next();
  };
}

module.exports = { routeValidator };
