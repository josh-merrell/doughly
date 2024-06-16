const { errorGen } = require('../../middleware/errorHandling');
const { sendTokenNotifications } = require('../../services/firebase/firebaseHandler');
('use strict');

// const { default: axios } = require('axios');
module.exports = ({ db }) => {
  async function addToken(options) {
    try {
      const { token, userID } = options;
      if (!token) {
        throw errorGen('Token is required', 400);
      }

      // check for existing entry for this token
      const existingToken = await db.from('pushTokens').select().eq('pushToken', token).eq('userID', userID);
      const createTime = new Date().toISOString();
      if (existingToken.data.length > 0) {
        // we should just update the 'createTime' field
        const { error } = await db.from('pushTokens').update({ createTime: createTime }).eq('pushToken', token);
        if (error) {
          global.logger.error(`Error updating 'createTime' for existing token: ${error.message}`);
        }
        global.logger.info(`Updated 'createTime' of existing push token: ${token} for user ${userID}`);
      } else {
        // insert new token
        const { error } = await db.from('pushTokens').insert({ pushToken: token, userID, createTime });
        if (error) {
          global.logger.error(`Error inserting new token: ${error.message}`);
          throw errorGen('Error inserting new token', 500);
        }
        global.logger.info(`Added push token: ${token} for user ${userID}`);
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications addToken', err.code || 520, err.name || 'unhandledError_pushNotifications-addToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function removeToken(options) {
    const { token, userID } = options;

    try {
      if (!token) {
        throw errorGen('Token is required', 400);
      }

      // first check if token exists
      const existingToken = await db.from('pushTokens').select().eq('pushToken', token);
      if (existingToken.data.length === 0) {
        return;
      }

      const { error } = await db.from('pushTokens').delete().eq('pushToken', token);
      if (error) {
        global.logger.error(`Error deleting token: ${error.message}`);
        throw errorGen('Error deleting token', 500);
      }
      global.logger.info(`Deleted push token: ${token} for user ${userID}`);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications removeToken', err.code || 520, err.name || 'unhandledError_pushNotifications-removeToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function removeUserTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      // first get count of tokens for this user
      const { data: tokens } = await db.from('pushTokens').select().eq('userID', userID);
      if (tokens.length === 0) {
        return;
      }
      const { error } = await db.from('pushTokens').delete().eq('userID', userID);
      if (error) {
        global.logger.error(`Error deleting user tokens: ${error.message}`);
        throw errorGen('Error deleting user tokens', 500);
      }
      global.logger.info(`Deleted ${tokens.length} (all) push tokens for user ${userID}`);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications removeUserTokens', err.code || 520, err.name || 'unhandledError_pushNotifications-removeUserTokens', err.isOperational || false, err.severity || 2);
    }
  }

  async function userTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: tokens, error } = await db.from('pushTokens').select().eq('userID', userID);
      if (error) {
        global.logger.error(`Error getting user tokens: ${error.message}`);
        throw errorGen('Error getting user tokens', 500);
      }

      global.logger.info(`Got ${tokens.length} push tokens for user ${userID}`);
      return tokens;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications userToken', err.code || 520, err.name || 'unhandledError_pushNotifications-userToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function getOtherUserPushTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: tokens, error } = await db.from('pushTokens').select().eq('userID', userID);
      if (error) {
        global.logger.error(`Error getting user tokens: ${error.message}`);
        throw errorGen('Error getting user tokens', 500);
      }

      global.logger.info(`Got ${tokens.length} push tokens for other user: ${userID}`);
      return tokens;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications getOtherUserPushToken', err.code || 520, err.name || 'unhandledError_pushNotifications-getOtherUserPushToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { token, userID } = options;

    try {
      if (!token) {
        throw errorGen('Token is required', 400);
      }
      const lastUsedTime = new Date().toISOString();
      const { error } = await db.from('pushTokens').update({ lastUsedTime }).eq('pushToken', token).eq('userID', userID);
      if (error) {
        global.logger.error(`Error updating 'lastUsedTime' for token: ${error.message}`);
        throw errorGen('Error updating token', 500);
      }
      global.logger.info(`Updated 'lastUsedTime' for push token: ${token} for user ${userID}`);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications update', err.code || 520, err.name || 'unhandledError_pushNotifications-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function sendNotification(options) {
    const { destTokens, type, data } = options;

    try {
      global.logger.info(`in sendNotification: destTokens: ${destTokens}, type: ${type}, data: ${data}`);
      if (!destTokens || !type || !data) {
        throw errorGen('destTokens, type, and data are required', 400);
      }
      global.logger.info(`in sendNotification: destTokens: ${JSON.stringify(destTokens)}, type: ${type}, data: ${JSON.stringify(data)}`);

      // send the notification
      sendTokenNotifications(destTokens, type, data);
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications sendNotification', err.code || 520, err.name || 'unhandledError_pushNotifications-sendNotification', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      userTokens,
      otherUser: getOtherUserPushTokens,
    },
    add: {
      token: addToken,
    },
    remove: {
      token: removeToken,
      userTokens: removeUserTokens,
    },
    update,
    send: {
      notification: sendNotification,
    },
  };
};
