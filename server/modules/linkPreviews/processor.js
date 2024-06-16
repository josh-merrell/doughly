('use strict');
const { errorGen } = require('../../middleware/errorHandling');

module.exports = ({ db, dbPublic }) => {
  async function recipePreview({ recipeID }) {
    try {
      const fallbackContent = `
      <!DOCTYPE html>
      <html>
          <head>
              <title>Own Your Recipes on Doughly</title>
              <meta property='og:title' content='Own Your Recipes on Doughly' />
              <meta property='og:description' content='Discover, create, and share your treasured recipes. Join free with a few taps.' />
              <meta property='og:url' content='https://doughly.co' />
              <meta property='og:type' content='website' />
              <meta charset='utf-8'>
              <meta property='fb:app_id' content='399157002973005' />
          </head>
          <body>
          </body>
      </html>
      `;
      // get recipe data
      const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID).eq('deleted', false);
      if (error) {
        global.logger.error(`Error getting recipe: ${recipeID}: ${error.message}. Returning fallback content.`);
        return fallbackContent;
      }
      if (recipe.length === 0) {
        global.logger.error(`Recipe not found: ${recipeID}`);
        throw errorGen(`Recipe not found: ${recipeID}`, 404);
      }
      const recipeData = recipe[0];

      const { data: author, error: authorError } = await dbPublic.from('profiles').select().eq('user_id', recipeData.userID).single();
      if (authorError) {
        global.logger.error(`Error getting author: ${recipeData.userID}: ${error.message}. Returning recipe content without author name.`);
      }
      let description = 'Check out my recipe, then make and share your own!';
      if (author.name_first) {
        description = `${author.name_first} made the recipe ${recipeData.title} public. Come check it out!`;
        if (recipeData.type === 'heirloom') {
          description = `${author.name_first} shared a treasured recipe for your eyes only. Come check it out! ${recipeData.title}.`;
        }
      }

      // Generate HTML content with Open Graph meta tags
      const htmlContent = `
      <!DOCTYPE html>
      <html>
          <head>
              <title>${recipeData.title} on Doughly</title>
              <meta property='og:title' content='${recipeData.title} on Doughly' />
              <meta property='og:description' content='${description}' />
              <meta property='og:image' content='${recipeData.photoURL}' />
              <meta property='og:image:width' content='375' />  
              <meta property='og:image:height' content='225' /> 
              <meta property='og:url' content='https://doughly.co/recipe/public/${recipeData.recipeID}' />
              <meta property='og:type' content='website' />
              <meta charset='utf-8'>
              <meta property='fb:app_id' content='399157002973005' />
              <meta property='og:image:alt' content='Image for recipe with title: ${recipeData.title}' />
          </head>
          <body>
          </body>
      </html>`;

      global.logger.info(htmlContent);
      return htmlContent;
    } catch (err) {
      throw errorGen('Unhandled Error in linkPreviews recipePreview', 520, 'unhandledError_linkPreviews-recipePreview', false, 2); //message, code, name, operational, severity
    }
  }

  return {
    get: {
      recipePreview,
    },
  };
};
