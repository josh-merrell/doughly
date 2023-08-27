const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

    // eslint-disable-next-line no-useless-catch
    try {
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
      console.log(`BACKEND GOT URL: ${url}`)
      return url;
    } catch (err) {
      throw err;
    }
  }

  return {
    create,
  };
};
