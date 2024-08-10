('use strict');

const { getDraftUnitRatios, getUnitRatio, batchApproveUnitRatios, batchDeleteUnitRatios, addUnitRatio } = require('../../../services/unitRatioStoreService');
const { errorGen } = require('../../../middleware/errorHandling');

module.exports = () => {
  async function getUnitRatioProcessor(options) {
    const { material, unitA, unitB, authorization, userID } = options;

    try {
      global.logger.info({message:`'*unitRatios-getUnitRatioProcessor* getUnitRatioProcessor'. UNITA: ${unitA} UNITB: ${unitB}`, level:7, timestamp: new Date().toISOString(), 'userID': userID});
      if (unitA === unitB) return { ratio: 1, needsReview: false };
      // use 'getUnitRatio' method from 'unitRatioStoreService' to get the ratio. It will first check common ratios for a match, then check the store for an approved ratio match, then fallback to asking AI. If AI returns a ratio, it will submit it as a draft to the store for admin approval.
      const returner = await getUnitRatio(material, unitA, unitB, authorization, userID);
      return returner;
    } catch (err) {
      throw errorGen(err.message || '*unitRatios-getUnitRatioProcessor* Unhandled Error', err.code || 520, err.name || 'unhandledError_unitRatios-getUnitRatioProcessor', err.isOperational || false, err.severity || 2);
    }
  }
  async function checkForRatioProcessor(options) {
    const { material, unitA, unitB } = options;

    try {
      if (!material || !unitA || !unitB) {
        return errorGen('*unitRatios-checkForRatioProcessor* Missing required query parameters', 400);
      }
      const returner = await checkForRatioProcessor(material, unitA, unitB);
      return returner;
    } catch (err) {
      throw errorGen(err.message || '*unitRatios-checkForRatioProcessor* Unhandled Error', err.code || 520, err.name || 'unhandledError_unitRatios-checkForRatioProcessor', err.isOperational || false, err.severity || 2);
    }
  }

  async function getAllDraftRatiosProcessor() {
    try {
      const returner = await getDraftUnitRatios();
      return returner;
    } catch (err) {
      throw errorGen(err.message || '*unitRatios-getAllDraftRatiosProcessor* Unhandled Error', err.code || 520, err.name || 'unhandledError_unitRatios-getAllDraftRatiosProcessor', err.isOperational || false, err.severity || 2);
    }
  }

  async function addUnitRatioProcesser(options) {
    const { material, unitA, unitB } = options;

    try {
      let { ratio } = options;
      if (!material || !unitA || !unitB || !ratio) {
        return errorGen('*unitRatios-addUnitRatioProcesser* Missing required body parameters', 400);
      }
      ratio = Number(ratio);
      if (ratio <= 0) {
        return errorGen('*unitRatios-addUnitRatioProcesser* Ratio must be a positive number', 400);
      }
      const returner = await addUnitRatio(material, unitA, unitB, ratio);
      return returner;
    } catch (err) {
      throw errorGen(err.message || '*unitRatios-addUnitRatioProcesser* Unhandled Error', err.code || 520, err.name || 'unhandledError_unitRatios-addUnitRatioProcessor', err.isOperational || false, err.severity || 2);
    }
  }

  async function batchUpdateRatiosProcessor(options) {
    const { ratios } = options;

    try {
      if (!ratios || !Array.isArray(ratios) || ratios.length === 0) {
        return errorGen('*unitRatios-batchUpdateRatiosProcessor* Missing required body parameters', 400);
      }
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
    } catch (err) {
      throw errorGen(err.message || '*unitRatios-batchUpdateRatiosProcessor* Unhandled Error', err.code || 520, err.name || 'unhandledError_unitRatios-batchUpdateRatiosProcessor', err.isOperational || false, err.severity || 2);
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
