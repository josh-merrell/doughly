const AWS = require('aws-sdk');
const Jimp = require('jimp');
const s3 = new AWS.S3();

const TARGET_BUCKET_PATH = process.env.TARGET_BUCKET_PATH;
const QUALITY_IMAGE = parseInt(process.env.QUALITY_IMAGE, 10);

exports.handler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('TARGET_BUCKET_PATH: ', TARGET_BUCKET_PATH);

  const bucket = event.Records[0].s3.bucket.name;
  console.log('Source Bucket: ', bucket);
  const sourceKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  console.log('Source Key: ', sourceKey);
  const destinationKey = sourceKey;

  try {
    // Download the image from S3
    const params = {
      Bucket: bucket,
      Key: sourceKey,
    };
    const data = await s3.getObject(params).promise();
    console.log(`Downloaded ${sourceKey} from ${bucket}`);

    // Compress the image using Jimp
    const image = await Jimp.read(data.Body);
    console.log(`finished reading image`);
    const compressedImageBuffer = await image
      .quality(QUALITY_IMAGE) // set JPEG quality
      .getBufferAsync(Jimp.MIME_JPEG);
    console.log(`Compressed image`);

    // Upload the compressed image to the target bucket
    const uploadParams = {
      Bucket: TARGET_BUCKET_PATH,
      Key: destinationKey,
      Body: compressedImageBuffer,
      ContentType: 'image/jpeg',
    };
    console.log('Upload Params: ', uploadParams);
    await s3.putObject(uploadParams).promise();
    console.log(`Uploaded compressed image to ${TARGET_BUCKET_PATH}/${destinationKey}`);

    return {
      statusCode: 200,
      body: `Processed and uploaded ${sourceKey} to ${destinationKey}`,
    };
  } catch (error) {
    console.error(`Error processing file ${sourceKey}:`, error);
    throw new Error(`Error processing file ${sourceKey}: ${error.message}`);
  }
};
