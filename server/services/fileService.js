const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { errorGen } = require('../middleware/errorHandling');

('use strict');

async function uploadBackup(type, userID, filepath) {
  global.logger.info(`Uploading backup filename: ${filepath}`);
  const fs = require('fs');
  const path = require('path');

  // Extract the filename from the full file path
  const filename = path.basename(filepath);

  // Read the file from the path
  const file = fs.readFileSync(filepath);

  // Set the key for the S3 object, using the desired path structure
  const s3Key = `${type}/${userID}/${filename}`;

  const s3Client = new S3Client({ region: 'us-west-2' });

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BACKUP_BUCKET_NAME,
    Key: s3Key,
    Body: file,
  });

  try {
    await s3Client.send(command);
    fs.unlinkSync(filepath); // Delete the temp file after uploading
    return { message: 'Successfully uploaded file' };
  } catch (err) {
    global.logger.error(`Error uploading file to S3. Key: ${s3Key}, Error:`, err);
    throw errorGen(`Error uploading file to S3. Key: ${s3Key}`, 400);
  }
}

async function deleteOldBackup(userID, filename) {
  const s3Client = new S3Client({ region: 'us-west-2' });

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BACKUP_BUCKET_NAME,
    Key: `daily/${userID}/${filename}`,
  });

  try {
    await s3Client.send(command);
    global.logger.info(`Successfully deleted old backup file: daily/${userID}/${filename}`);
    return { message: 'Successfully deleted old backup file' };
  } catch (err) {
    console.error(`Error deleting old backup file from S3. Path: daily/${userID}/${filename}, Error:`, err);
    throw new Error(`Error deleting old backup file from S3. Path: daily/${userID}/${filename}`);
  }
}

async function replaceFilePath(path) {
  if (!path) {
    return '';
  }

  return path.replace(S3_URL, CDN_URL);
}

const filePaths = {
  s3URL: 'https://s3.us-west-2.amazonaws.com/dl.images',
  cdnURL: 'https://d1fksulu953xbh.cloudfront.net',
}

module.exports = {
  uploadBackup,
  deleteOldBackup,
  filePaths,
  replaceFilePath
};
