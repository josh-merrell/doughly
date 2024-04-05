exports.handler = async () => {
  const baseUrl = process.env.DOUGHLY_PROD_API_URL;

  // send a request to trigger deleting all expired stock. Don't wait for a response
  fetch(`${baseUrl}/ingredientStocks/deleteAllExpired`, {
    method: 'POST',
    headers: {
      authorization: 'override',
    },
  });
};
