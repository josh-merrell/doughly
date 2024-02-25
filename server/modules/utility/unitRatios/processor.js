('use strict');

const { getDraftUnitRatios, getUnitRatio, batchApproveUnitRatios, batchDeleteUnitRatios, addUnitRatio } = require('../../../services/unitRatioStoreService');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = () => {
  async function getUnitRatioProcessor(options) {
    const { material, unitA, unitB, authorization, userID } = options;
    console.log(`'getUnitRatioProcessor'. UNITA: ${unitA} UNITB: ${unitB}`);
    if (unitA === unitB) return { ratio: 1, needsReview: false };
    try {
      // use 'getUnitRatio' method from 'unitRatioStoreService' to get the ratio. It will first check common ratios for a match, then check the store for an approved ratio match, then fallback to asking AI. If AI returns a ratio, it will submit it as a draft to the store for admin approval.
      const returner = await getUnitRatio(material, unitA, unitB, authorization, userID);
      return returner;
    } catch (error) {
      global.logger.error(`'getUnitRatio' Error getting unit ratio '${material}-${unitA}-${unitB}': ${error}`);
      throw errorGen(`'getUnitRatio' Error getting unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
    }
  }
  async function checkForRatioProcessor(options) {
    const { material, unitA, unitB } = options;
    if (!material || !unitA || !unitB) {
      return errorGen('Missing required query parameters', 400);
    }
    try {
      const returner = await checkForRatioProcessor(material, unitA, unitB);
      return returner;
    } catch (error) {
      global.logger.error(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`);
      throw errorGen(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
    }
  }

  async function getAllDraftRatiosProcessor() {
    try {
      const returner = await getDraftUnitRatios();
      return returner;
    } catch (error) {
      global.logger.error(`'getAllDraftRatios' Error getting all draft unit ratios: ${error}`);
      throw errorGen(`'getAllDraftRatios' Error getting all draft unit ratios: ${error}`, 400);
    }
  }

  async function addUnitRatioProcesser(options) {
    const { material, unitA, unitB } = options;
    let { ratio } = options;
    if (!material || !unitA || !unitB || !ratio) {
      return errorGen('Missing required body parameters', 400);
    }
    ratio = Number(ratio);
    if (ratio <= 0) {
      return errorGen('Ratio must be a positive number', 400);
    }
    try {
      const returner = await addUnitRatio(material, unitA, unitB, ratio);
      return returner;
    } catch (error) {
      global.logger.error(`'addUnitRatio' Error adding unit ratio '${material}-${unitA}-${unitB}': ${error}`);
      throw errorGen(`'addUnitRatio' Error adding unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
    }
  }

  async function batchUpdateRatiosProcessor(options) {
    const { ratios } = options;
    if (!ratios || !Array.isArray(ratios) || ratios.length === 0) {
      return errorGen('Missing required body parameters', 400);
    }
    try {
      const approves = [];
      const deletes = [];
      for (let i = 0; i < ratios.length; i++) {
        const ratio = ratios[i];
        if (ratio.type === 'approve') {
          if (ratio.materialAndUnits && ratio.ratio && ratio.ratio > 0) {
            approves.push(ratio);
          }
        }
        if (ratio.type === 'delete') {
          if (ratio.materialAndUnits) {
            deletes.push(ratio);
          }
        }
      }
      const approveResults = approves.length ? await batchApproveUnitRatios(approves) : { currentStatus: 'success', data: null };
      const deleteResults = deletes.length ? await batchDeleteUnitRatios(deletes) : { currentStatus: 'success', data: null };
      return { approveResults, deleteResults };
    } catch (error) {
      global.logger.error(`'batchUpdateRatios' Error batch updating unit ratios: ${error}`);
      throw errorGen(`'batchUpdateRatios' Error batch updating unit ratios: ${error}`, 400);
    }
  }

  return {
    checkForRatioProcessor,
    getUnitRatioProcessor,
    getAllDraftRatiosProcessor,
    addUnitRatioProcesser,
    batchUpdateRatiosProcessor,
  };
};
