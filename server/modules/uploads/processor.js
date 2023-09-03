const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

('use strict');

module.exports = () => {
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
    const { userID, photoURL } = options;

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
      global.logger.info(`Successfully deleted file ${decodedKey}`);
      return { message: 'Successfully deleted file' };
    } catch (err) {
      global.error(`Error deleting file ${decodedKey}:`, err);
      throw err;
    }
  }

  return {
    create,
    remove,
  };
};
