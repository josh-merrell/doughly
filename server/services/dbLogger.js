const { default: axios } = require('axios');

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
    global.logger.info(`**KITCHEN LOG ENTRY ID: ${log.data.kitchenLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
    return log.data.kitchenLogID;
  } catch (error) {
    global.logger.error(`Error creating kitchen log: ${error.message}`);

    return null;
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
    global.logger.info(`**RECIPE LOG ENTRY ID: ${log.data.recipeLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
    return log.data.recipeLogID;
  } catch (error) {
    global.logger.error(`Error creating recipe log: ${error.message}`);
    return null;
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
    global.logger.info(`**USER LOG ENTRY ID: ${log.data.userLogID}** ${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
    return log.data.userLogID;
  } catch (error) {
    global.logger.error(`Error creating user log: ${error.message}`);
    return null;
  }
}

async function createRecipeFeedbackLog(userID, authorization, recipeID, satisfaction, difficulty, note) {
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
      },
      {
        headers: {
          authorization: authorization,
        },
      },
    );
    global.logger.info(`**RECIPE FEEDBACK LOG ENTRY ID: ${log.data.recipeFeedbackID}** recipeID:${recipeID}|satisfaction:${satisfaction}|difficulty:${difficulty}`);
    return log.data.recipeFeedbackID;
  } catch (error) {
    global.logger.error(`Error creating recipe feedback log: ${error.message}`);

    return null;
  }
}

module.exports = {
  createKitchenLog,
  createRecipeLog,
  createUserLog,
  createRecipeFeedbackLog,
};
