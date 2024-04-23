('use strict');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  function htmlEscape(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function recipePreview({ recipeID }) {
    try {
      const recipeData = {
        title: 'Veg Club Sandwich',
        description: 'Check out my new recipe on Doughly. This is a delicious veg club sandwich that is perfect for a quick lunch or dinner.',
        image: 'https://s3.us-west-2.amazonaws.com/dl.images/recipe/ade96f70-4ec5-4ab9-adfe-0645b16e1ced/1000021838.jpg',
        url: `https://doughly.co/recipe/public/1124033000000001`,
      };

      // Generate HTML content with Open Graph meta tags
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta property="og:title" content="${htmlEscape(recipeData.title)}" />
        <meta property="og:description" content="${htmlEscape(recipeData.description)}" />
        <meta property="og:image" content="${htmlEscape(recipeData.image)}" />
        <meta property="og:image:width" content="375" />  
        <meta property="og:image:height" content="225" /> 
        <meta property="og:url" content="${htmlEscape(recipeData.url)}" />
        <meta property="og:type" content="website" />
        <meta charset="utf-8">
        </head>
        <body>
        </body>
        </html>`;

      return htmlContent;
    } catch (e) {
      global.logger.error(`Error getting recipe link preview: ${e.message}`);
      throw errorGen(`Error getting recipe link preview: ${e.message}`, 400);
    }
  }

  return {
    get: {
      recipePreview,
    },
  };
};
