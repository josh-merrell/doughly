const { default: axios } = require('axios');
const { errorGen } = require('../middleware/errorHandling');

async function createKitchenLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  try {
    let log = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/logs/kitchen`,
      {
        userID,
        IDtype: 70,
        eventType,
        subjectID,
        ...(associatedID && { associatedID }),
        ...(oldValue && { oldValue }),
        ...(newValue && { newValue }),
        ...(message && { message }),
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info({ message: `*dbLogger-createKitchenLog* **KITCHEN LOG ENTRY ID: ${log.data.kitchenLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return log.data.kitchenLogID;
  } catch (err) {
    throw errorGen(err.message || '*dbLogger-createKitchenLog* Unhandled Error', err.code || 520, err.name || 'unhandledError_dbLogger-createKitchenLog', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
  }
}

async function createRecipeLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  try {
    let log = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/logs/recipe`,
      {
        userID,
        IDtype: 71,
        eventType,
        subjectID,
        ...(associatedID && { associatedID }),
        ...(oldValue && { oldValue }),
        ...(newValue && { newValue }),
        ...(message && { message }),
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info({ message: `*dbLogger-createRecipeLog* **RECIPE LOG ENTRY ID: ${log.data.recipeLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return log.data.recipeLogID;
  } catch (error) {
    throw errorGen(error.message || '*dbLogger-createRecipeLog* Unhandled Error', error.code || 520, error.name || 'unhandledError_dbLogger-createRecipeLog', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
}

//same for createUserLog
async function createUserLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  try {
    let log = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/logs/user`,
      {
        userID,
        IDtype: 72,
        eventType,
        subjectID,
        ...(associatedID && { associatedID }),
        ...(oldValue && { oldValue }),
        ...(newValue && { newValue }),
        ...(message && { message }),
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info({ message: `*dbLogger-createUserLog* **USER LOG ENTRY ID: ${log.data.userLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return log.data.userLogID;
  } catch (error) {
    throw errorGen(error.message || '*dbLogger-createUserLog* Unhandled Error', error.code || 520, error.name || 'unhandledError_dbLogger-createUserLog', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
}

async function createShoppingLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  try {
    let log = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/logs/shopping`,
      {
        userID,
        IDtype: 73,
        eventType,
        subjectID,
        ...(associatedID && { associatedID }),
        ...(oldValue && { oldValue }),
        ...(newValue && { newValue }),
        ...(message && { message }),
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info({ message: `*dbLogger-createShoppingLog* **SHOPPING LOG ENTRY ID: ${log.data.shoppingLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return log.data.shoppingLogID;
  } catch (error) {
    throw errorGen(error.message || '*dbLogger-createShoppingLog* Unhandled Error', error.code || 520, error.name || 'unhandledError_dbLogger-createShoppingLog', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
}

async function createRecipeFeedbackLog(userID, authorization, recipeID, recipeTitle, satisfaction, difficulty, note) {
  try {
    let log = await axios.post(
      `${process.env.NODE_HOST}:${process.env.PORT}/logs/recipeFeedback`,
      {
        userID,
        IDtype: 73,
        recipeID,
        satisfaction,
        difficulty,
        note,
        message: `Made ${recipeTitle}; rating ${satisfaction}/10`,
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info({ message: `*dbLogger-createRecipeFeedbackLog* **RECIPE FEEDBACK LOG ENTRY ID: ${log.data.recipeFeedbackID}** recipeID:${recipeID}|satisfaction:${satisfaction}|difficulty:${difficulty}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    return log.data.recipeFeedbackID;
  } catch (error) {
    throw errorGen(error.message || '*dbLogger-createRecipeFeedbackLog* Unhandled Error', error.code || 520, error.name || 'unhandledError_dbLogger-createRecipeFeedbackLog', error.isOperational || false, error.severity || 2); //message, code, name, operational, severity
  }
}

module.exports = {
  createKitchenLog,
  createRecipeLog,
  createUserLog,
  createRecipeFeedbackLog,
  createShoppingLog,
};
