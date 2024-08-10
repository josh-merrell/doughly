require('dotenv').config({ path: '../.env' });
const Redis = require('ioredis');
const { getNextSequence } = require('./ID');

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

global.redis = redis;

// Get the argument from the CLI
const typeFromArg = process.argv[2];

if (!typeFromArg) {
  process.exit(1);
}

const runTest = async () => {
  const result = await getNextSequence(typeFromArg);
  process.exit(0);
};

runTest();
