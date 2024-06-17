const Ajv = require('ajv');
const ajv = new Ajv();

function routeValidator(schema, dataToValidate) {
  return (req, res, next) => {
    const data = req[dataToValidate];
    const valid = ajv.validate(schema, data);
    if (!valid) {
      global.logger.info({ message: `INVALID DATA '${JSON.stringify(data)}' IN REQUEST ${data}. ${ajv.errorsText()}.`, level: 3, timestamp: new Date().toISOString(), userID: 0 });
      return res.status(422).json({ error: `${ajv.errors[0].dataPath.slice(1)} ${ajv.errors[0].message}` });
    }
    if (!req.userID) {
      global.logger.info({ message: `No userID in request`, level: 3, timestamp: new Date().toISOString(), userID: 0 });
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}

module.exports = { routeValidator };
