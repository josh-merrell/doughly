const { initializeApp, applicationDefault } = require('firebase-admin/app');

const defaultApp = initializeApp({
  credential: applicationDefault(),
  projectId: 'doughly',
});

module.exports = {
  
};
