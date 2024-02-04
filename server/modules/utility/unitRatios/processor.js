('use strict');

const { getDraftUnitRatios, checkForRatio, addUnitRatio, batchApproveUnitRatios, batchDeleteUnitRatios } = require('../../../services/unitRatioStoreService');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = () => {
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

  async function getAllDraftRatios(options) {
    try {
      const returner = await getDraftUnitRatios();
      return returner;
    } catch (error) {
      global.logger.error(`'getAllDraftRatios' Error getting all draft unit ratios: ${error}`);
      throw errorGen(`'getAllDraftRatios' Error getting all draft unit ratios: ${error}`, 400);
    }
  }

  async function addUnitRatio(options) {
    const { material, unitA, unitB, ratio } = options;
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
    getAllDraftRatios,
    addUnitRatio,
    batchUpdateRatios,
  };
};
