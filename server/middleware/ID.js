const Redis = require('ioredis');

const redisHost = process.env.AWS_ID_CACHE_REDIS_HOST;

const getNextYearMonthDaySequence = async (type) => {
  try {
    let redis;
    let yearMonthDay = '';
    // if NODE_ENV is development, access local redis instance at redis://default:redispw@localhost:49153, otherwise access AWS redis instance
    if (process.env.NODE_ENV === 'development') {
      redis = new Redis({
        host: 'localhost',
        port: 49151,
        password: 'redispw',
      });
      yearMonthDay = generateYearMonthDayLocal();
    } else {
      redis = new Redis({
        host: redisHost,
        port: 6379,
      });
      yearMonthDay = await redis.get(`IDyearMonthDay`);
    }
    let sequence = await redis.incr(`IDsequence_type${type}`);

    if (sequence >= 99999999) {
      await redis.set(`IDsequence_type${type}`, 0);
    }

    //prepend sequence with 0s to make it 8 digits long
    sequence = String(sequence).padStart(8, '0');

    return `${yearMonthDay}${sequence}`;
  } catch (err) {
    global.logger.info({message:`*getNextYearMonthDaySequence* Could not get next sequence: ${err}`, level:3, timestamp: new Date().toISOString(), 'userID': 0});
    return null;
  }
};

function generateYearMonthDayLocal() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  const year = now.getUTCFullYear().toString().slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

async function generateID(req, res, next) {
  /**
  Format IDs follows this pattern:
  [TT][YYMMDD][XXXXXXXX]
  TT: Type indicator (01 for recipe, 02 for recipe ingredient, etc.)
  YYMMDD: Date part (year, month, day) (year portion is only the 2 least significant digits "21" for the year 2021)
  XXXXXXXX: a sequence number that resets to 00000001 every day at midnight Pacific time (UTC-8), separate sequence is maintained for each type in AWS Redis cache

  This value is stored in req.dataID, and is used by the POST processors to insert the new row into the db as a bigInt (8Byte integer)
  **/
  let type = req.body.IDtype;

  if (!type) {
    return res.status(490).send('Type parameter is missing, cannot generate custom ID');
  }
  if (type === 0) {
    return res.status(491).send('Default Type of "0" is not allowed');
  }
  // if type is only 1 digit, prepend a 0
  if (type.length === 1) {
    type = `0${type}`;
  }

  // get current UTC time date
  // const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  // year = now.getUTCFullYear().toString().slice(-2);
  // if (process.env.NODE_ENV === 'development') {
  //   year -= 20;
  // }
  // month = String(now.getUTCMonth() + 1).padStart(2, '0');
  // day = String(now.getUTCDate()).padStart(2, '0');

  const yearMonthDaySequence = await getNextYearMonthDaySequence(type);

  // const id = `${type}${year}${month}${day}${sequence}`;
  const id = `${type}${yearMonthDaySequence}`;

  if (next === 'handlerCall') {
    return id;
  }
  req.customID = id;
  next();
}

async function generateIDFunction(type) {
  if (!type) {
    return 'Type parameter is missing, cannot generate custom ID';
  }
  if (type === 0) {
    return 'Default Type of "0" is not allowed';
  }
  // if type is only 1 digit, prepend a 0
  if (type.length === 1) {
    type = `0${type}`;
  }

  // get current UTC time date
  // const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  // year = now.getUTCFullYear().toString().slice(-2);
  // if (process.env.NODE_ENV === 'development') {
  //   year -= 20;
  // }
  // month = String(now.getUTCMonth() + 1).padStart(2, '0');
  // day = String(now.getUTCDate()).padStart(2, '0');

  const yearMonthDaySequence = await getNextYearMonthDaySequence(type);

  // const id = `${type}${year}${month}${day}${sequence}`;
  const id = `${type}${yearMonthDaySequence}`;

  return id;
}

module.exports = {
  generateID,
  generateIDFunction,
  getNextYearMonthDaySequence,
};
