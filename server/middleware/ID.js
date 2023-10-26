const Redis = require('ioredis');

const redisHost = process.env.AWS_ID_CACHE_REDIS_HOST;

const getNextSequence = async (type) => {
  try {
    let redis;
    // if NODE_ENV is development, access local redis instance at redis://default:redispw@localhost:49153, otherwise access AWS redis instance
    if (process.env.NODE_ENV === 'development') {
      redis = new Redis({
        host: 'localhost',
        port: 49153,
        password: 'redispw',
      });
    } else {
      redis = new Redis({
        host: redisHost,
        port: 6379,
      });
    }
    const sequence = await redis.incr(`IDsequence_type${type}`);

    if (sequence >= 99999999) {
      await redis.set(`IDsequence_type${type}`, 0);
    }

    return sequence;
  } catch (err) {
    console.log('Could not get next sequence:', err);
    return null;
  }
};

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
    return res.status(410).send('Type parameter is missing, cannot generate custom ID');
  }
  if (type === 0) {
    return res.status(411).send('Default Type of "0" is not allowed');
  }
  // if type is only 1 digit, prepend a 0
  if (type.length === 1) {
    type = `0${type}`;
  }

  const now = new Date();
  const year = now.getUTCFullYear().toString().slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  let sequence = await getNextSequence(type);
  //prepend sequence with 0s to make it 8 digits long
  sequence = String(sequence).padStart(8, '0');

  const id = `${type}${year}${month}${day}${sequence}`;

  if (next === 'handlerCall') {
    return id;
  }
  req.customID = id;
  next();
}

module.exports = {
  generateID,
  getNextSequence,
};
