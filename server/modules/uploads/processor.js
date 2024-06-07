const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { errorGen } = require('../../middleware/errorHandling');

('use strict');

module.exports = ({ db, dbDefault }) => {
  async function create(options) {
    const { userID, type, fileName, fileType } = options;

    const s3Client = new S3Client({ region: 'us-west-2' });
    const key = `${type}/${userID}/${fileName}`;
    const contentType = fileType;

    let command;
    // temp images (such as for used in vision recipe import) are stored in a different bucket to avoid cloudfront caching
    console.log(`IN GET SIGNED URL. TYPE: ${type}, KEY: ${key}, fileName: ${fileName}, `);
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
  }

  async function uploadBackup(filepath, filename) {
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

    try {
      await s3Client.send(command);
      fs.unlinkSync(filepath);
      return { message: 'Successfully uploaded file' };
    } catch (err) {
      global.logger.error(`Error uploading file to S3. Path:${path}, Error:`, err);
      throw errorGen(`Error uploading file to S3. Path:${path}`, 400);
    }
  }

  async function deleteOldBackup(userID, filename) {
    const s3Client = new S3Client({ region: 'us-west-2' });

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BACKUP_BUCKET_NAME,
      Key: `${type}/${userID}/${filename}`,
    });

    try {
      await s3Client.send(command);
      global.logger.info(`Successfully deleted old backup file: backups/${userID}/${filename}`);
      return { message: 'Successfully deleted old backup file' };
    } catch (err) {
      console.error(`Error deleting old backup file from S3. Path: backups/${userID}/${filename}, Error:`, err);
      throw new Error(`Error deleting old backup file from S3. Path: backups/${userID}/${filename}`);
    }
  }

  async function remove(options) {
    const { userID, photoURL, type, id } = options;

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

    try {
      // remove file from S3
      await s3Client.send(deleteCommand);

      // remove url from database
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
      throw errorGen(`Error deleting file from S3. Key:${decodedKey}`, 400);
    }
  }

  return {
    create,
    remove,
    uploadBackup,
    deleteOldBackup,
  };
};
