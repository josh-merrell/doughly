const { GoogleAuth } = require('google-auth-library');
const path = require('path');

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFilename: path.join(__dirname, `./doughly-fb50f2f0040b.json`),
    // Specify the scopes required by the API you are calling
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  const accessToken = await auth.getAccessToken();
  return accessToken;
}

module.exports = {
  getAccessToken,
};
