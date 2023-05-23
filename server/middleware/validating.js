const Ajv = require('ajv');
const ajv = new Ajv();

function routeValidator(schema, location = 'body', paramID = '') {
  return (req, res, next) => {
    const dataToValidate = location === 'query' ? req.query : req.body;
    const valid = ajv.validate(schema, dataToValidate);
    if (!valid) {
      global.logger.info(`Invalid ${location} error: ${ajv.errorsText()}`);
      return res.status(422).json(ajv.errors);
    }
    if (paramID) {
      const paramIDValid = ajv.validate(schema, { [paramID]: req.params[paramID] });
      if (!paramIDValid) {
        global.logger.info(`Invalid ${location} error: ${ajv.errorsText()}`);
        return res.status(423).json(ajv.errors);
      }
    }
    next();
  };
}

module.exports = { routeValidator };
