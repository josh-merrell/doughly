const AWS = require('aws-sdk');
require('dotenv').config();
const { errorGen } = require('../middleware/errorHandling.js');

const awsConfig = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
AWS.config.update(awsConfig);
const docClient = new AWS.DynamoDB.DocumentClient();

const checkForRatio = async (material, unitA, unitB) => {
  const params = {
    TableName: 'dl-prod-unit-conversion-store',
    Key: `${material}-${unitA}-${unitB}`,
  };
  try {
    const data = await docClient.get(params).promise();
    if (data.Item && data.Item.currentStatus === 'approved') {
      return {
        currentStatus: 'success',
        ratio: data.Item.ratio,
      };
    }
    if (data.Item) {
      return {
        currentStatus: 'success',
        ratio: null,
      };
    }
    // if this item does not exist, we need to check for the reverse
    const reverseParams = {
      TableName: 'dl-prod-unit-conversion-store',
      Key: `${material}-${unitB}-${unitA}`,
    };
    const reverseData = await docClient.get(reverseParams).promise();
    if (reverseData.Item && reverseData.Item.currentStatus === 'approved') {
      // return the inverse of the ratio
      return {
        currentStatus: 'success',
        ratio: 1 / reverseData.Item.ratio,
      };
    }
  } catch (error) {
    global.logger.error(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`);
    throw errorGen(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
  }
};

const addUnitRatio = async (material, unitA, unitB, ratio) => {
  const params = {
    TableName: 'dl-prod-unit-conversion-store',
    Item: {
      materialAndUnits: `${material}-${unitA}-${unitB}`,
      ratio: ratio,
      currentStatus: 'draft',
    },
  };
  try {
    const data = await docClient.put(params).promise();
    global.logger.info(`'addUnitRatio' Added unit ratio '${material}-${unitA}-${unitB}' in draft currentStatus`);
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    global.logger.error(`'addUnitRatio' Error adding unit ratio '${material}-${unitA}-${unitB}': ${error}`);
    throw errorGen(`'addUnitRatio' Error adding unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
  }
};

const getDraftUnitRatios = async () => {
  global.logger.info(`'getDraftUnitRatios' Retrieving all draft unit ratios`)
  const params = {
    TableName: 'dl-prod-unit-conversion-store',
    FilterExpression: 'currentStatus = :currentStatus',
    ExpressionAttributeValues: {
      ':currentStatus': 'draft',
    },
  };
  try {
    const data = await docClient.scan(params).promise();
    global.logger.info(`'getDraftUnitRatios' Retrieved ${data.Items.length} draft unit ratios`);
    return {
      currentStatus: 'success',
      data: data.Items,
    };
  } catch (error) {
    global.logger.error(`'getDraftUnitRatios' Error retrieving draft unit ratios: ${error}`);
    throw errorGen(`'getDraftUnitRatios' Error retrieving draft unit ratios: ${error}`, 400);
  }
};

const batchApproveUnitRatios = async (ratios) => {
  const promises = [];
  ratios.forEach((ratio) => {
    const params = {
      TableName: 'dl-prod-unit-conversion-store',
      Item: {
        materialAndUnits: ratio.materialAndUnits,
        ratio: ratio.ratio,
        currentStatus: 'approved',
      },
    };
    promises.push(docClient.put(params).promise());
  });
  try {
    const data = await Promise.all(promises);
    global.logger.info(`'batchApproveUnitRatios' Approved ${ratios.length} unit ratios`);
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    global.logger.error(`'batchApproveUnitRatios' Error approving unit ratios ${JSON.stringify(ratios)}: ${error}`);
    throw errorGen(`'batchApproveUnitRatios' Error approving unit ratios: ${error}`, 400);
  }
};

const batchDeleteUnitRatios = async (ratios) => {
  const promises = [];
  ratios.forEach((ratio) => {
    const params = {
      TableName: 'dl-prod-unit-conversion-store',
      Key: {
        materialAndUnits: ratio.materialAndUnits,
      },
    };
    promises.push(docClient.delete(params).promise());
  });
  try {
    const data = await Promise.all(promises);
    global.logger.info(`'batchDeleteUnitRatios' Deleted ${ratios.length} unit ratios`);
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    global.logger.error(`'batchDeleteUnitRatios' Error deleting unit ratios ${JSON.stringify(ratios)}: ${error}`);
    throw errorGen(`'batchDeleteUnitRatios' Error deleting unit ratios: ${error}`, 400);
  }
};

module.exports = {
  checkForRatio,
  addUnitRatio,
  batchApproveUnitRatios,
  batchDeleteUnitRatios,
  getDraftUnitRatios,
};

/**
materialAndUnits: {
  salt-Cup-Cup: {
    ratio: 1,
    currentStatus: 'draft'
  },
  salt-Cup-Tablespoon: {
    ratio: .0625,
    currentStatus: 'approved'
  }
}

**/
