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
        global.logger.info({ message: `*linkPreviews-recipePreview* Error getting recipe: ${recipeID}: ${error.message}. Returning fallback content.`, level: 3, timestamp: new Date().toISOString(), userID: 0 });
        return fallbackContent;
      }
      if (recipe.length === 0) {
        throw errorGen(`*linkPreviews-recipePreview* Recipe not found: ${recipeID}`, 515, 'cannotComplete', true, 3);
      }
      const recipeData = recipe[0];

      const { data: author, error: authorError } = await dbPublic.from('profiles').select().eq('user_id', recipeData.userID).single();
      if (authorError) {
        global.logger.info({ message: `*linkPreviews-recipePreview* Error getting author: ${recipeData.userID}: ${error.message}. Returning recipe content without author name.`, level: 3, timestamp: new Date().toISOString(), userID: 0 });
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

      return htmlContent;
    } catch (err) {
      throw errorGen(err.message || '*linkPreviews-recipePreview* Unhandled Error', err.code || 520, err.name || 'unhandledError_linkPreviews-recipePreview', err.isOperational || false, err.severity || 2);
    }
  }

  async function invitePreview() {
    try {
      // Generate HTML content with Open Graph meta tags
      const htmlContent = `
      <!DOCTYPE html>
      <html>
          <head>
              <title>Join Doughly</title>
              <meta property='og:title' content='Join Doughly' />
              <meta property='og:description' content='Discover, create, and share your treasured recipes. Join free now.' />
              <meta property='og:image' content='https://s3.us-west-2.amazonaws.com/dl.images-compressed/Invite+Image.png' />
              <meta property='og:image:width' content='772' />  
              <meta property='og:image:height' content='404' />
              <meta property='og:url' content='https://doughly.co/invite' />
              <meta property='og:type' content='website' />
              <meta charset='utf-8'>
              <meta property='fb:app_id' content='399157002973005' />
              <meta property='og:image:alt' content='Image for Doughly invite preview' />
          </head>
          <body>
          </body>
      </html>`;

      return htmlContent;
    } catch (err) {
      throw errorGen(err.message || '*linkPreviews-invitePreview* Unhandled Error', err.code || 520, err.name || 'unhandledError_linkPreviews-invitePreview', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      recipePreview,
      invitePreview,
    },
  };
};
