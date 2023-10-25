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
  global.logger.info(`**KITCHEN LOG ENTRY ID: ${log.data.kitchenLogID}** eventType:${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
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
  global.logger.info(`**RECIPE LOG ENTRY ID: ${log.data.recipeLogID}** eventType:${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
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
  global.logger.info(`**USER LOG ENTRY ID: ${log.data.userLogID}** eventType:${eventType}|subjectID:${subjectID}|oldValue:${oldValue}|newValue:${newValue}`);
}

module.exports = {
  createKitchenLog,
  createRecipeLog,
  createUserLog,
};
