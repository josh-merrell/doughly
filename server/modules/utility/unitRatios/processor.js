('use strict');

const { getDraftUnitRatios, getGramRatio, getPurchaseUnitRatio, batchApproveUnitRatios, batchDeleteUnitRatios, addUnitRatio } = require('../../../services/unitRatioStoreService');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = () => {
  async function getUnitRatio(options) {
    const { material, unitA, unitB, authorization, userID } = options;
    console.log(`UNITA: ${unitA} UNITB: ${unitB}`);
    if (unitA === unitB) return { ratio: 1, needsReview: false };
    try {
      // use 'getPurchaseUnitRatio' or 'getGramRatio' method from 'unitRatioStoreService' to get the ratio. It will first check the store, then fallback to asking AI. If AI returns a ratio, it will submit it as a draft to the store.
      let returner;
      if (unitA === 'gram') {
        returner = await getGramRatio(material, unitB, authorization, userID);
      } else if (unitB === 'gram') {
        returner = await getGramRatio(material, unitA, authorization, userID);
      } else {
        returner = await getPurchaseUnitRatio(material, unitA, unitB, authorization, userID);
      }
      return returner;
    } catch (error) {
      global.logger.error(`'getUnitRatio' Error getting unit ratio '${material}-${unitA}-${unitB}': ${error}`);
      throw errorGen(`'getUnitRatio' Error getting unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
    }
  }
  async function checkForRatio(options) {
    const { material, unitA, unitB } = options;
    if (!material || !unitA || !unitB) {
      return errorGen('Missing required query parameters', 400);
    }
    try {
      const returner = await checkForRatio(material, unitA, unitB);
      return returner;
    } catch (error) {
      global.logger.error(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`);
      throw errorGen(`'checkForRatio' Error checking for unit ratio '${material}-${unitA}-${unitB}': ${error}`, 400);
    }
  }

  async function getAllDraftRatios() {
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

  async function batchUpdateRatios(options) {
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
    checkForRatio,
    getUnitRatio,
    getAllDraftRatios,
    addUnitRatioProcesser,
    batchUpdateRatios,
  };
};
