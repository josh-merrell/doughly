const axios = require('axios');

exports.handler = async (event, context, callback) => {
  const baseUrl = process.env.DOUGHLY_PROD_API_URL;

  try {
    const response = await axios.post(`${baseUrl}/${event.path}`, event.body || {}, {
      headers: {
        Authorization: 'postmanTest',
      },
    });

    if (!response || !response.status || response.status !== 200) {
      throw new Error(`Request failed with status: ${response.status}`);
    }

    console.log(`Successfully sent req to ${event.path}. RESPONSE: ${response.status}`);
    callback(null, `Success: ${response.status}`);
  } catch (error) {
    console.error(`Failed when sending req to ${event.path}: ${error}`);
    callback(error);
  }
};
