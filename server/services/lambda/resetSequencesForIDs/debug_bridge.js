const { handler } = require('./index.js');

const testEvent = {};

handler(testEvent, {}, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Result:', result);
  }
});
