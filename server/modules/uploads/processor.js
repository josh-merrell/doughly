const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { errorGen } = require('../../middleware/errorHandling');

('use strict');

module.exports = ({ db, dbDefault }) => {
  async function createSignedURL(options) {
    const { userID, type, fileName, fileType } = options;

    try {
      const s3Client = new S3Client({ region: 'us-west-2' });
      const key = `${type}/${userID}/${fileName}`;
      const contentType = fileType;

      let command;
      // temp images (such as for used in vision recipe import) are stored in a different bucket to avoid cloudfront caching
      if (type === 'temp') {
        command = new PutObjectCommand({
          Bucket: process.env.AWS_TEMP_IMAGE_BUCKET_NAME,
          Key: key,
          ContentType: contentType,
        });
      } else {
        command = new PutObjectCommand({
          Bucket: process.env.AWS_IMAGE_BUCKET_NAME,
          Key: key,
          ContentType: contentType,
        });
      }

      const url = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });

      return url;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in uploads createSignedURL', err.code || 520, err.name || 'unhandledError_uploads-createSignedURL', err.isOperational || false, err.severity || 2);
    }
  }

  async function uploadBackup(filepath, filename) {
    try {
      // read the file from the path
      const fs = require('fs');
      const path = require('path');
      const file = fs.readFileSync(path.join(__dirname, filepath, filename));

      // take the file and path as args. Upload the file to the path
      const s3Client = new S3Client({ region: 'us-west-2' });

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BACKUP_BUCKET_NAME,
        Key: filepath,
        Body: file,
      });
      await s3Client.send(command);
      fs.unlinkSync(filepath);
      return { message: 'Successfully uploaded file' };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in uploads uploadBackup', err.code || 520, err.name || 'unhandledError_uploads-uploadBackup', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteOldBackup(userID, filename) {
    try {
      const s3Client = new S3Client({ region: 'us-west-2' });

      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BACKUP_BUCKET_NAME,
        Key: `${type}/${userID}/${filename}`,
      });
      await s3Client.send(command);
      global.logger.info({message:`*uploads-deleteOldBackup* Successfully deleted old backup file: backups/${userID}/${filename}`, level:6, timestamp: new Date().toISOString(), 'userID': userID});
      return { message: 'Successfully deleted old backup file' };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in uploads deleteOldBackup', err.code || 520, err.name || 'unhandledError_uploads-deleteOldBackup', err.isOperational || false, err.severity || 2);
    }
  }

  async function remove(options) {
    const { userID, photoURL, type, id } = options;

    try {
      const urlParts = photoURL.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const key = `${type}/${userID}/${fileName}`;

      const decodedKey = decodeURIComponent(key);

      const s3Client = new S3Client({ region: 'us-west-2' });

      const deleteParams = {
        Bucket: process.env.AWS_IMAGE_BUCKET_NAME,
        Key: decodedKey,
      };

      const deleteCommand = new DeleteObjectCommand(deleteParams);
      // remove file from S3
      await s3Client.send(deleteCommand);

      // remove url from database
      let data;
      if (type === 'recipeStep') {
        // delete photo from recipeStep
        const { data: updatedRecipeStep, error } = await db.from('recipeSteps').update({ photoURL: null }).match({ recipeStepID: id }).select('*');
        if (error) {
          throw errorGen(`Error deleting photo when updating recipeStep ${id}: ${error}`, 514, 'failSupabaseDelete', true, 3);
        } else {
          data = updatedRecipeStep[0];
        }
      } else if (type === 'recipeCategory') {
        // delete photo from recipeCategory
        const { data: updatedRecipeCategory, error } = await db.from('recipeCategories').update({ photoURL: null }).match({ recipeCategoryID: id }).select('*');
        if (error) {
          throw errorGen(`Error deleting photo when updating recipeCategory ${id}: ${error}`, 514, 'failSupabaseDelete', true, 3);
        } else {
          data = updatedRecipeCategory[0];
        }
      } else if (type === 'recipe') {
        // delete photo from recipe
        const { data: updatedRecipe, error } = await db.from('recipes').update({ photoURL: null }).match({ recipeID: id }).select('*');
        if (error) {
          throw errorGen(`Error deleting photo when updating recipe ${id}: ${error}`, 514, 'failSupabaseDelete', true, 3);
        } else {
          data = updatedRecipe[0];
        }
      } else if (type === 'profile') {
        // delete photo from profile
        const { data: updatedProfile, error } = await dbDefault.from('profiles').update({ photo_url: null }).match({ user_id: userID }).select('*');
        if (error) {
          throw errorGen(`Error deleting photo when updating profile for user ${id}: ${error}`, 514, 'failSupabaseDelete', true, 3);
        } else {
          data = updatedProfile[0];
        }
      }
      return { message: 'Successfully deleted file', data };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in uploads remove', err.code || 520, err.name || 'unhandledError_uploads-remove', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    create: createSignedURL,
    remove,
    uploadBackup,
    deleteOldBackup,
  };
};
