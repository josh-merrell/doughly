const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-west-2' });

const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

const bucketName = 'dl.images';
const lambdaFunctionName = 'dl-compress-image';

async function listAllObjects(bucket, continuationToken) {
  const params = {
    Bucket: bucket,
    ContinuationToken: continuationToken,
  };

  const data = await s3.listObjectsV2(params).promise();
  return data;
}

async function triggerLambdaForAllObjects(bucket) {
  let continuationToken;
  do {
    const data = await listAllObjects(bucket, continuationToken);
    continuationToken = data.IsTruncated ? data.NextContinuationToken : null;

    for (const item of data.Contents) {
      if (!item.Key.includes('DONE')) {
        const event = {
          Records: [
            {
              s3: {
                bucket: {
                  name: bucket,
                },
                object: {
                  key: item.Key,
                },
              },
            },
          ],
        };
        const params = {
          FunctionName: lambdaFunctionName,
          InvocationType: 'Event', // Async invocation
          Payload: JSON.stringify(event),
        };

        await lambda.invoke(params).promise();
        console.log(`Triggered Lambda for ${item.Key}`);
      }
    }
  } while (continuationToken);
}

triggerLambdaForAllObjects(bucketName)
  .then(() => console.log('All objects processed.'))
  .catch((err) => console.error('Error processing objects:', err));
