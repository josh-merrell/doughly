const { errorGen } = require('../../middleware/errorHandling');
const { sendTokenNotifications } = require('../../services/firebase/firebaseHandler');
('use strict');

// const { default: axios } = require('axios');
module.exports = ({ db }) => {
  async function addToken(options) {
    try {
      const { token, userID } = options;
      if (!token) {
        throw errorGen(`Token is required to add token`, 510, 'dataValidationErr', false, 3);
      }

      // check for existing entry for this token
      const existingToken = await db.from('pushTokens').select().eq('pushToken', token).eq('userID', userID);
      const createTime = new Date().toISOString();
      if (existingToken.data.length > 0) {
        // we should just update the 'createTime' field
        const { error } = await db.from('pushTokens').update({ createTime: createTime }).eq('pushToken', token);
        if (error) {
          throw errorGen(`Error updating 'createTime' for existing token: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        global.logger.info({ message: `*pushNotifications-sendTokenNotification* Updated 'createTime' of existing push token: ${token} for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      } else {
        // insert new token
        const { error } = await db.from('pushTokens').insert({ pushToken: token, userID, createTime });
        if (error) {
          throw errorGen(`Error inserting new token: ${error.message}`, 512, 'failSupabaseInsert', true, 3);
        }
        global.logger.info({ message: `*pushNotifications-sendTokenNotification* Added push token: ${token} for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications addToken', err.code || 520, err.name || 'unhandledError_pushNotifications-addToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function removeToken(options) {
    const { token, userID } = options;

    try {
      if (!token) {
        throw errorGen(`Token is required to remove token`, 510, 'dataValidationErr', false, 3);
      }

      // first check if token exists
      const existingToken = await db.from('pushTokens').select().eq('pushToken', token);
      if (existingToken.data.length === 0) {
        return;
      }

      const { error } = await db.from('pushTokens').delete().eq('pushToken', token);
      if (error) {
        throw errorGen(`Error deleting token: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      global.logger.info({ message: `*pushNotifications-removeToken* Deleted push token: ${token} for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications removeToken', err.code || 520, err.name || 'unhandledError_pushNotifications-removeToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function removeUserTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required to removeUserTokens`, 510, 'dataValidationErr', false, 3);
      }

      // first get count of tokens for this user
      const { data: tokens } = await db.from('pushTokens').select().eq('userID', userID);
      if (tokens.length === 0) {
        return;
      }
      const { error } = await db.from('pushTokens').delete().eq('userID', userID);
      if (error) {
        throw errorGen(`Error deleting user tokens: ${error.message}`, 514, 'failSupabaseDelete', true, 3);
      }
      global.logger.info({ message: `*pushNotifications-removeUserTokens* Deleted ${tokens.length} (all) push tokens for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications removeUserTokens', err.code || 520, err.name || 'unhandledError_pushNotifications-removeUserTokens', err.isOperational || false, err.severity || 2);
    }
  }

  async function userTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required to get user tokens`, 510, 'dataValidationErr', false, 3);
      }

      const { data: tokens, error } = await db.from('pushTokens').select().eq('userID', userID);
      if (error) {
        throw errorGen(`Error getting user tokens: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      global.logger.info({ message: `*pushNotifications-userTokens* Got ${tokens.length} push tokens for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return tokens;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications userToken', err.code || 520, err.name || 'unhandledError_pushNotifications-userToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function getOtherUserPushTokens(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required to get user tokens`, 510, 'dataValidationErr', false, 3);
      }

      const { data: tokens, error } = await db.from('pushTokens').select().eq('userID', userID);
      if (error) {
        throw errorGen(`Error getting user tokens: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      global.logger.info({ message: `*pushNotifications-getOtherUserPushTokens* Got ${tokens.length} push tokens for other user: ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
      return tokens;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications getOtherUserPushToken', err.code || 520, err.name || 'unhandledError_pushNotifications-getOtherUserPushToken', err.isOperational || false, err.severity || 2);
    }
  }

  async function update(options) {
    const { token, userID } = options;

    try {
      if (!token) {
        throw errorGen(`Token is required to update token`, 510, 'dataValidationErr', false, 3);
      }
      const lastUsedTime = new Date().toISOString();
      const { error } = await db.from('pushTokens').update({ lastUsedTime }).eq('pushToken', token).eq('userID', userID);
      if (error) {
        throw errorGen(`Error updating 'lastUsedTime' for token: ${error.message}`, 513, 'failSupabaseUpdate', true, 3);
      }
      global.logger.info({ message: `*pushNotifications-update* Updated 'lastUsedTime' for push token: ${token} for user ${userID}`, level: 6, timestamp: new Date().toISOString(), userID: userID });
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in pushNotifications update', err.code || 520, err.name || 'unhandledError_pushNotifications-update', err.isOperational || false, err.severity || 2);
    }
  }

  async function sendNotification(options) {
    const { destTokens, type, data } = options;

    try {
      global.logger.info({ message: `*pushNotifications-sendNotification* in sendNotification: destTokens: ${destTokens}, type: ${type}, data: ${JSON.stringify(data)}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
      if (!destTokens || !type || !data) {
        throw errorGen(`destTokens, type, and data are required to sendNotification`, 510, 'dataValidationErr', false, 3);
      }
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
