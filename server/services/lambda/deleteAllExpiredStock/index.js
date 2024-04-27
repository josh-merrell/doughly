const axios = require('axios');

exports.handler = async (event, context, callback) => {
  const baseUrl = process.env.DOUGHLY_PROD_API_URL;

  try {
    const response = await axios.post(
      `${baseUrl}/ingredientStocks/deleteAllExpired`,
      {},
      {
        headers: {
          Authorization: 'postmanTest',
        },
      },
    );

    // Check if the response status is 200
    if (!response || !response.status || response.status !== 200) {
      // Not a 200 response, throw an error
      throw new Error(`Request failed with status: ${response.status}`);
    }

    console.log(`Successfully triggered deleteAllExpiredStock: ${response.status}`);
    // Success case: Use callback to return success
    callback(null, `Success: ${response.status}`);
  } catch (error) {
    console.error('Failed to trigger deleteAllExpiredStock', error);
    // Error case: Use callback to signal failure
    callback(error);
  }
};
