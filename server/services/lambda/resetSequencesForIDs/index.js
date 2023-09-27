const Redis = require('ioredis');

exports.handler = async (event) => {
  const redis = new Redis({
    host: process.env.AWS_ID_CACHE_REDIS_HOST,
    port: 6379,
  });

  for (let i = 10; i < 90; i++) {
    await redis.set(`IDsequence_type${i}`, '0');
  }

  return {
    statusCode: 200,
    body: JSON.stringify('IDsequences reset to 0'),
  };
};
