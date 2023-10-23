const { default: axios } = require('axios');

async function loggerCreate(userID, subjectID, category, eventType, authorization, subjectName = null) {
  //add a 'created' log entry
  let log = await axios.post(
    `${process.env.NODE_HOST}:${process.env.PORT}/logs`,
    {
      userID,
      IDtype: 23, // needed for API to generate custom ID for new log entry
      subjectID,
      category,
      eventType,
      // include subjectName only if it is not null
      ...(subjectName && { subjectName }),
    },
    {
      headers: {
        authorization: authorization,
      },
    },
  );
  global.logger.info(`**LOG ENTRY ID: ${log.data.logID}** ${category}|${eventType}|subjectID:${subjectID}`);
}

module.exports = {
  loggerCreate,
};
