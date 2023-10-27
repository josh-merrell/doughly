const { default: axios } = require('axios');

async function createKitchenLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  let log = await axios.post(
    `${process.env.NODE_HOST}:${process.env.PORT}/logs/kitchen`,
    {
      userID,
      IDtype: 70, // needed for API to generate custom ID for new kitchenLog entry
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
}

async function createRecipeLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  let log = await axios.post(
    `${process.env.NODE_HOST}:${process.env.PORT}/logs/recipe`,
    {
      userID,
      IDtype: 71, // needed for API to generate custom ID for new recipeLog entry
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
}

//same for createUserLog
async function createUserLog(userID, authorization, eventType, subjectID, associatedID = null, oldValue = null, newValue = null, message = null) {
  let log = await axios.post(
    `${process.env.NODE_HOST}:${process.env.PORT}/logs/user`,
    {
      userID,
      IDtype: 72, // needed for API to generate custom ID for new userLog entry
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
}

async function createRecipeFeedbackLog(userID, authorization, recipeID, satisfaction, difficulty, note) {
  let log = await axios.post(
    `${process.env.NODE_HOST}:${process.env.PORT}/logs/recipeFeedback`,
    {
      userID,
      IDtype: 73, // needed for API to generate custom ID for new recipeFeedbackLog entry
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
}

module.exports = {
  createKitchenLog,
  createRecipeLog,
  createUserLog,
  createRecipeFeedbackLog,
};
