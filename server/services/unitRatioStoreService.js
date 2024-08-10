const AWS = require('aws-sdk');
require('dotenv').config();
const { errorGen } = require('../middleware/errorHandling.js');
const { getUnitRatioAI } = require('./aiHandlers.js');

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
    Key: {
      materialAndUnits: `${material}-${unitA}-${unitB}`,
    },
  };
  try {
    const data = await docClient.get(params).promise();
    if (data.Item) {
      if (data.Item.currentStatus === 'approved') {
        return {
          currentStatus: 'success',
          ratio: data.Item.ratio,
        };
      }
      return {
        currentStatus: 'success',
        ratio: null,
      };
    }
    // if this item does not exist, we need to check for the reverse
    const reverseParams = {
      TableName: 'dl-prod-unit-conversion-store',
      Key: {
        materialAndUnits: `${material}-${unitB}-${unitA}`,
      },
    };
    const reverseData = await docClient.get(reverseParams).promise();
    if (reverseData.Item) {
      if (reverseData.Item.currentStatus === 'approved') {
        // return the inverse of the ratio
        return {
          currentStatus: 'success',
          ratio: 1 / reverseData.Item.ratio,
        };
      }
    }
    return {
      currentStatus: 'success',
      ratio: null,
    };
  } catch (err) {
    throw errorGen(err.message || `Unhandled Error in unitRationStoreService checkForRatio, ${material}-${unitA}-${unitB}': ${error}`, err.code || 520, err.name || 'unhandledError_unitRationStoreService-checkForRatio', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
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
    // first, check if this item already exists
    const checkParams = {
      TableName: 'dl-prod-unit-conversion-store',
      Key: {
        materialAndUnits: `${material}-${unitA}-${unitB}`,
      },
    };
    const checkData = await docClient.get(checkParams).promise();
    if (checkData.Item) {
      // if item is approved, return
      if (checkData.Item.currentStatus === 'approved') {
        global.logger.info({ message: `*unitRatioStoreService-addUnitRatio* Unit ratio '${material}-${unitA}-${unitB}' already exists and is approved`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
        return {
          currentStatus: 'success',
          data: null,
        };
      }
    }

    // no approved item found, so add the draft or overwrite the existing draft
    const data = await docClient.put(params).promise();
    global.logger.info({ message: `*unitRatioStoreService-addUnitRatio* Added unit ratio '${material}-${unitA}-${unitB}' in draft currentStatus`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    throw errorGen(error.message || `Unhandled Error in unitRationStoreService addUnitRatio, ${material}-${unitA}-${unitB}': ${error}`, error.code || 520, error.name || 'unhandledError_unitRationStoreService-addUnitRatio', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
};

const getDraftUnitRatios = async () => {
  global.logger.info({ message: `*unitRatioStoreService-getDraftUnitRatios* Retrieving all draft unit ratios`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
  const params = {
    TableName: 'dl-prod-unit-conversion-store',
    FilterExpression: 'currentStatus = :currentStatus',
    ExpressionAttributeValues: {
      ':currentStatus': 'draft',
    },
  };
  try {
    const data = await docClient.scan(params).promise();
    global.logger.info({ message: `'*unitRatioStoreService-getDraftUnitRatios* Retrieved ${data.Items.length} draft unit ratios`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return {
      currentStatus: 'success',
      data: data.Items,
    };
  } catch (error) {
    throw errorGen(error.message || `Unhandled Error in unitRationStoreService getDraftUnitRatios: ${error}`, error.code || 520, error.name || 'unhandledError_unitRationStoreService-getDraftUnitRatios', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
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
    global.logger.info({ message: `*unitRatioStoreService-batchApproveUnitRatios* Approved ${ratios.length} unit ratios`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    throw errorGen(error.message || `Unhandled Error in unitRationStoreService batchApproveUnitRatios: ${error}`, error.code || 520, error.name || 'unhandledError_unitRationStoreService-batchApproveUnitRatios', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
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
    global.logger.info({ message: `*unitRatioStoreService-batchDeleteUnitRatios* Deleted ${ratios.length} unit ratios`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return {
      currentStatus: 'success',
      data,
    };
  } catch (error) {
    throw errorGen(error.message || `Unhandled Error in unitRationStoreService batchDeleteUnitRatios: ${error}`, error.code || 520, error.name || 'unhandledError_unitRationStoreService-batchDeleteUnitRatios', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
};

const getUnitRatio = async (material, unitA, unitB, authorization, userID) => {
  if (unitA === unitB) return { puchaseUnitRatio: 1, needsReview: false };
  // first, check for common ratio
  const checkCommonResult = await checkCommonRatios(unitA, unitB);
  if (checkCommonResult.success) {
    global.logger.info({ message: `*unitRatioStoreService-getUnitRatio* Common ratio found for ${unitA}-${unitB}: ${checkCommonResult.ratio}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return { ratio: checkCommonResult.ratio, needsReview: false, cost: 0 };
  }

  // next, try checking the store for approved matching ratio
  const storeCheck = await checkForRatio(material, unitA, unitB);
  if (storeCheck.currentStatus === 'success') {
    if (storeCheck.ratio) {
      global.logger.info({ message: `*unitRatioStoreService-getUnitRatio* Store ratio found for ${material}-${unitA}-${unitB}: ${storeCheck.ratio}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
      return { ratio: storeCheck.ratio, needsReview: false, cost: 0 };
    }
  }
  global.logger.info({ message: `*unitRatioStoreService-getUnitRatio* No store ratio found for ${material}-${unitA}-${unitB}, asking AI`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
  // try asking AI for estimate
  const data = await getUnitRatioAI(userID, authorization, material, unitA, unitB);
  const aiEstimate = Number(JSON.parse(data.response));
  global.logger.info({ message: `*unitRatioStoreService-getUnitRatio* AI estimate for ${material}-${unitA}-${unitB}: ${aiEstimate}.`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
  if (aiEstimate) {
    // submit this returned ratio as a draft to the store
    addUnitRatio(material, unitA, unitB, aiEstimate);
    return { ratio: aiEstimate, needsReview: true, cost: data.cost };
  }
  // otherwise, just return default of "1"
  return { ratio: 1, needsReview: true, cost: 0 };
};

const checkCommonRatios = async (unitA, unitB) => {
  const commonRatios = {
    'gram-weightOunce': 28.35,
    'weightOunce-gram': 0.035,
    'gram-pound': 453.59,
    'pound-gram': 0.0022,
    'weightOunce-pound': 16,
    'pound-weightOunce': 0.0625,
    'fluidOunce-tablespoon': 0.5,
    'tablespoon-fluidOunce': 2,
    'fluidOunce-teaspoon': 0.167,
    'teaspoon-fluidOunce': 6,
    'cup-tablespoon': 0.063,
    'tablespoon-cup': 16,
    'cup-teaspoon': 0.021,
    'teaspoon-cup': 48,
    'cup-fluidOunce': 0.125,
    'fluidOunce-cup': 8,
    'cup-gallon': 16,
    'gallon-cup': 0.063,
    'cup-liter': 4.226,
    'liter-cup': 0.236,
    'cup-milliliter': 0.004,
    'milliliter-cup': 236.588,
    'tablespoon-teaspoon': 0.333,
    'teaspoon-tablespoon': 3,
    'fluicOunce-gallon': 128,
    'gallon-fluidOunce': 0.008,
    'fluidOunce-liter': 33.814,
    'liter-fluidOunce': 0.029,
    'milliliter-gallon': 3785.41,
    'gallon-milliliter': 0.00026,
    'pint-cup': 0.5,
    'cup-pint': 2,
    'quart-cup': 0.25,
    'cup-quart': 4,
    'quart-pint': 0.5,
    'pint-quart': 2,
    'pint-gallon': 8,
    'gallon-pint': 0.125,
    'quart-gallon': 4,
    'gallon-quart': 0.25,
    'tablespoon-gallon': 256,
    'gallon-tablespoon': 0.0039,
    'teaspoon-gallon': 768,
    'gallon-teaspoon': 0.0013,
    'gallon-liter': 0.264,
    'liter-gallon': 3.785,
    'pound-kilogram': 2.205,
    'kilogram-pound': 0.453,
    'tablespoon-liter': 67.628,
    'liter-tablespoon': 0.015,
    'teaspoon-liter': 202.884,
    'liter-teaspoon': 0.005,
    'fluidOunce-milliliter': 29.574,
    'milliliter-fluidOunce': 0.034,
  };
  const key = `${unitA}-${unitB}`;
  if (commonRatios[key]) {
    return { success: true, ratio: commonRatios[key] };
  }
  return { success: false, ratio: null };
};

module.exports = {
  checkForRatio,
  addUnitRatio,
  batchApproveUnitRatios,
  batchDeleteUnitRatios,
  getDraftUnitRatios,
  getUnitRatio,
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
