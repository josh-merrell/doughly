const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFilename: path.join(__dirname, `./doughly-ee4c38c0be84.json`),
    // Specify the scopes required by the API you are calling
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  const accessToken = await auth.getAccessToken();
  return accessToken;
}

module.exports = {
  getAccessToken,
};
