const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

('use strict');

module.exports = ({ db, dbDefault }) => {
  async function create(options) {
    const { userID, fileName, fileType } = options;

    const s3Client = new S3Client({ region: 'us-west-2' });
    const key = `${userID}/${fileName}`;
    const contentType = fileType;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_RECIPE_PHOTO_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return url;
  }

  async function remove(options) {
    const { userID, photoURL, type, id } = options;

    const urlParts = photoURL.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const key = `${userID}/${fileName}`;

    const decodedKey = decodeURIComponent(key);

    const s3Client = new S3Client({ region: 'us-west-2' });

    const deleteParams = {
      Bucket: process.env.AWS_RECIPE_PHOTO_BUCKET_NAME,
      Key: decodedKey,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);

    try {
      await s3Client.send(deleteCommand);
      let data;
      if (type === 'recipeStep') {
        // delete photo from recipeStep
        const { data: updatedRecipeStep, error } = await db.from('recipeSteps').update({ photoURL: null }).match({ recipeStepID: id }).select('*');
        if (error) {
          global.logger.error(`Error deleting photo when updating recipeStep ${id}:`, error);
          throw error;
        } else {
          data = updatedRecipeStep[0];
        }
      } else if (type === 'recipeCategory') {
        // delete photo from recipeCategory
        const { data: updatedRecipeCategory, error } = await db.from('recipeCategories').update({ photoURL: null }).match({ recipeCategoryID: id }).select('*');
        if (error) {
          global.logger.error(`Error deleting photo when updating recipeCategory ${id}:`, error);
          throw error;
        } else {
          data = updatedRecipeCategory[0];
        }
      } else if (type === 'recipe') {
        // delete photo from recipe
        const { data: updatedRecipe, error } = await db.from('recipes').update({ photoURL: null }).match({ recipeID: id }).select('*');
        if (error) {
          global.logger.error(`Error deleting photo when updating recipe ${id}:`, error);
          throw error;
        } else {
          data = updatedRecipe[0];
        }
      } else if (type === 'profile') {
        // delete photo from profile
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update({ photo_url: null }).match({ user_id: userID }).select('*');
        if (error) {
          global.logger.error(`Error deleting photo when updating profile for User ${userID}:`, error);
          throw error;
        } else {
          data = updatedProfile[0];
        }
      }
      return { message: 'Successfully deleted file', data };
    } catch (err) {
      global.logger.error(`Error deleting file from S3. Key:${decodedKey}, Error:`, err);
      throw err;
    }
  }

  return {
    create,
    remove,
  };
};
