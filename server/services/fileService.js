const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { errorGen } = require('../middleware/errorHandling');

('use strict');

async function uploadBackup(type, userID, filepath) {
  global.logger.info({ message: `ploading backup filename: ${filepath}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
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
    throw errorGen(err.message || 'Unhandled Error in fileService uploadBackup', err.code || 520, err.name || 'unhandledError_fileService-uploadBackup', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
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
    global.logger.info({ message: `Successfully deleted old backup file: daily/${userID}/${filename}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return { message: 'Successfully deleted old backup file' };
  } catch (err) {
    throw errorGen(err.message || 'Unhandled Error in fileService deleteOldBackup', err.code || 520, err.name || 'unhandledError_fileService-deleteOldBackup', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
  }
}

module.exports = {
  uploadBackup,
  deleteOldBackup,
};
