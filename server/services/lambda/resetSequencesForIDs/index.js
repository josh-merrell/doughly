const Redis = require('ioredis');

exports.handler = async (event) => {
  const redis = new Redis({
    host: process.env.AWS_ID_CACHE_REDIS_HOST,
    port: 6379,
  });

  // reset IDyearMonthDay to be string in format of YYMMDD UTC
  await redis.set(`IDyearMonthDay`, generateYearMonthDayLocal());

  // reset each type sequence
  for (let i = 10; i < 90; i++) {
    await redis.set(`IDsequence_type${i}`, '0');
  }

  return {
    statusCode: 200,
    body: JSON.stringify('IDsequences reset to 0'),
  };
};

function generateYearMonthDayLocal() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  const year = now.getUTCFullYear().toString().slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}
