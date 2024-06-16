const { errorGen } = require('../../middleware/errorHandling');
const { generateIDFunction } = require('../../middleware/ID');
('use strict');

module.exports = ({ db, dbPublic }) => {
  async function getAllMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required', 400`, 510, 'dataValidationErr', false, 3);
      }

      // get 'lastMessageSyncTime' from profile
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select('lastMessageSyncTime').eq('user_id', userID).single();
      if (profileError) {
        throw errorGen(`Error getting profile: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const lastMessageSyncTime = profile.lastMessageSyncTime;

      // Start all promises concurrently
      const promises = [
        getIngredientStockExpiredMessages({ userID, lastMessageSyncTime }),
        getIngredientOutOfStockMessages({ userID, lastMessageSyncTime }),
        getNewFollowerMessages({ userID, lastMessageSyncTime }),
        getNewFriendMessages({ userID, lastMessageSyncTime }),
        getNewFriendRequestMessages({ userID, lastMessageSyncTime }),
        getfolloweePublicRecipeCreatedMessages({ userID, lastMessageSyncTime }),
        getFriendHeirloomRecipeCreatedMessages({ userID, lastMessageSyncTime }),
        getWelcomeMessage({ userID, lastMessageSyncTime }),
      ];

      // Wait for all promises to settle
      const results = await Promise.allSettled(promises);

      const messages = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          messages.push(...result.value);
        } else {
          throw errorGen(result.reason.message || 'Unhandled Error in messages getAllMessages', result.reason.code || 520, result.reason.name || 'unhandledError_messages-getAllMessages', result.reason.isOperational || false, result.reason.severity || 2);
        }
      }

      // update 'lastMessageSyncTime' in profile (timestampz)
      const { error: updateError } = await dbPublic.from('profiles').update({ lastMessageSyncTime: new Date().toISOString() }).eq('user_id', userID);
      if (updateError) {
        throw errorGen(`Error updating lastMessageSyncTime: ${updateError.message}`, 513, 'failSupabaseUpdate', true, 3);
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getAllMessages', err.code || 520, err.name || 'unhandledError_messages-getAllMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function acknowledgeMessage(options) {
    const { userID, message } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required`, 510, 'dataValidationErr', false, 3);
      }
      switch (message.type) {
        case 'ingredientStockExpired':
          await db.from('ingredientStocks').update({ appMessageStatus: 'acked' }).eq('userID', userID).eq('ingredientStockID', message.messageData.data.ingredientStockID);
          break;
        case 'ingredientOutOfStock':
          await db.from('ingredients').update({ appMessageStatus: 'acked' }).eq('userID', userID).eq('ingredientID', message.messageData.data.ingredientID);
          break;
        case 'newFollower':
          await db.from('followships').update({ appMessageStatus: 'acked' }).eq('followshipID', message.messageData.data.followshipID);
          break;
        case 'newFriend':
          await db.from('friendships').update({ appMessageStatusNewFriend: 'acked' }).eq('friendshipID', message.messageData.data.friendshipID);
          break;
        case 'newFriendRequest':
          await db.from('friendships').update({ appMessageStatusNewFriendRequest: 'acked' }).eq('friendshipID', message.messageData.data.friendshipID);
          break;
        case 'followeePublicRecipeCreated':
          await db.from('messages').update({ status: 'acked' }).eq('messageID', message.messageData.data.messageID);
          break;
        case 'friendHeirloomRecipeCreated':
          await db.from('messages').update({ status: 'acked' }).eq('messageID', message.messageData.data.messageID);
          break;
        default:
          throw errorGen(`Invalid message type`, 510, 'dataValidationErr', false, 3);
      }
      return {
        result: 'success',
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages acknowledgeMessage', err.code || 520, err.name || 'unhandledError_messages-acknowledgeMessage', err.isOperational || false, err.severity || 2);
    }
  }

  async function deleteMessage(options) {
    const { userID, message } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required`, 510, 'dataValidationErr', false, 3);
      }
      switch (message.type) {
        case 'ingredientStockExpired':
          await db.from('ingredientStocks').update({ appMessageStatus: null, appMessageDate: null }).eq('userID', userID).eq('ingredientStockID', message.messageData.data.ingredientStockID);
          break;
        case 'ingredientOutOfStock':
          await db.from('ingredients').update({ appMessageStatus: null, appMessageDate: null }).eq('userID', userID).eq('ingredientID', message.messageData.data.ingredientID);
          break;
        case 'newFollower':
          await db.from('followships').update({ appMessageStatus: null, appMessageDate: null }).eq('followshipID', message.messageData.data.followshipID);
          break;
        case 'newFriend':
          await db.from('friendships').update({ appMessageStatusNewFriend: null, appMessageDateNewFriend: null }).eq('friendshipID', message.messageData.data.friendshipID);
          break;
        case 'newFriendRequest':
          await db.from('friendships').update({ appMessageStatusNewFriendRequest: null, appMessageDateNewFriendRequest: null }).eq('friendshipID', message.messageData.data.friendshipID);
          break;
        case 'followeePublicRecipeCreated':
          await db.from('messages').update({ status: 'deleted' }).eq('messageID', message.messageData.data.messageID);
          break;
        case 'friendHeirloomRecipeCreated':
          await db.from('messages').update({ status: 'deleted' }).eq('messageID', message.messageData.data.messageID);
          break;
        default:
          throw errorGen(`Invalid message type`, 510, 'dataValidationErr', false, 3);
      }
      return {
        result: 'success',
      };
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages deleteMessage', err.code || 520, err.name || 'unhandledError_messages-deleteMessage', err.isOperational || false, err.severity || 2);
    }
  }

  async function getIngredientStockExpiredMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required`, 510, 'dataValidationErr', false, 3);
      }

      const { data: ingredientStocks, error } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false).in('appMessageStatus', ['notAcked', 'acked']);
      if (error) {
        throw errorGen(`Error getting ingredientStocks: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let ingredientStock of ingredientStocks) {
        if (!ingredientStock.appMessageDate) {
          global.logger.info({ message: `IngredientStockExpired message missing date`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          continue;
        }
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientStock.ingredientID).single();
        if (ingredientError) {
          throw errorGen(`Error getting ingredient: ${ingredientError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        const measurement = Math.round((ingredientStock.grams / ingredient.gramRatio) * 100) / 100;
        messages.push({
          type: 'ingredientStockExpired',
          messageData: {
            title: 'Ingredient Stock Expired',
            message: `${measurement} ${ingredient.purchaseUnit} of ${ingredient.name} has expired.`,
            status: ingredientStock.appMessageStatus,
            data: {
              ingredientStockID: ingredientStock.ingredientStockID,
              ingredientID: ingredientStock.ingredientID,
              ingredientName: ingredient.name,
              measurement,
              measurementUnit: ingredient.purchaseUnit,
            },
          },
          date: ingredientStock.appMessageDate,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getIngredientStockExpiredMessages', err.code || 520, err.name || 'unhandledError_messages-getIngredientStockExpiredMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function getIngredientOutOfStockMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: ingredients, error } = await db.from('ingredients').select().eq('userID', userID).eq('deleted', false).in('appMessageStatus', ['notAcked', 'acked']);
      if (error) {
        throw errorGen(`Error getting ingredients: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let ingredient of ingredients) {
        if (!ingredient.appMessageDate) {
          global.logger.info({ message: `IngredientOutOfStock message missing date`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          continue;
        }
        messages.push({
          type: 'ingredientOutOfStock',
          messageData: {
            title: 'Ingredient Out of Stock',
            message: `${ingredient.name} is out of stock.`,
            status: ingredient.appMessageStatus,
            data: {
              ingredientID: ingredient.ingredientID,
              ingredientName: ingredient.name,
            },
          },
          date: ingredient.appMessageDate,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getIngredientOutOfStockMessages', err.code || 520, err.name || 'unhandledError_messages-getIngredientOutOfStockMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function getNewFollowerMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: followships, error } = await db.from('followships').select().eq('following', userID).eq('deleted', false).in('appMessageStatus', ['notAcked', 'acked']);
      if (error) {
        throw errorGen(`Error getting followships: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let followship of followships) {
        if (!followship.appMessageDate) {
          global.logger.info({ message: `NewFollower message missing date`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', followship.userID).single();
        if (userError) {
          throw errorGen(`Error getting follower profile: ${userError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        messages.push({
          type: 'newFollower',
          messageData: {
            title: 'New Follower',
            message: `${user.username} is now following you.`,
            status: followship.appMessageStatus,
            data: {
              followshipID: followship.followshipID,
              followerNameFirst: user.name_first,
              followerNameLast: user.name_last,
              followerUserID: user.user_id,
            },
          },
          date: followship.appMessageDate,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getNewFollowerMessages', err.code || 520, err.name || 'unhandledError_messages-getNewFollowerMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function getNewFriendMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: friendships, error } = await db.from('friendships').select().eq('userID', userID).eq('deleted', false).in('appMessageStatusNewFriend', ['notAcked', 'acked']);
      if (error) {
        throw errorGen(`Error getting friendships: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let friendship of friendships) {
        if (!friendship.appMessageDateNewFriend) {
          global.logger.info({ message: `NewFriend message missing date`, level: 6, timestamp: new Date().toISOString(), userID: userID });
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', friendship.friend).single();
        if (userError) {
          throw errorGen(`Error getting friend profile: ${userError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        messages.push({
          type: 'newFriend',
          messageData: {
            title: 'New Friend',
            message: `${user.username} is now your friend.`,
            status: friendship.appMessageStatusNewFriend,
            data: {
              friendshipID: friendship.friendshipID,
              friendNameFirst: user.name_first,
              friendNameLast: user.name_last,
              friendUserID: user.user_id,
            },
          },
          date: friendship.appMessageDateNewFriend,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getNewFriendMessages', err.code || 520, err.name || 'unhandledError_messages-getNewFriendMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function getNewFriendRequestMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required`, 510, 'dataValidationErr', false, 3);
      }
      const { data: friendRequests, error } = await db.from('friendships').select().eq('userID', userID).eq('deleted', false).in('appMessageStatusNewFriendRequest', ['notAcked', 'acked']);
      if (error) {
        throw errorGen(`Error getting friendRequests: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let friendRequest of friendRequests) {
        if (!friendRequest.appMessageDateNewFriendRequest) {
          global.logger.info({ message: `NewFriendRequest message missing date`, level: 3, timestamp: new Date().toISOString(), userID: userID });
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', friendRequest.friend).single();
        if (userError) {
          throw errorGen(`Error getting friendRequest profile: ${userError.message}`, 511, 'failSupabaseSelect', true, 3);
        }
        messages.push({
          type: 'newFriendRequest',
          messageData: {
            title: 'New Friend Request',
            message: `${user.username} wants to be friends.`,
            status: friendRequest.appMessageStatusNewFriendRequest,
            data: {
              friendshipID: friendRequest.friendshipID,
              requesterNameFirst: user.name_first,
              requesterNameLast: user.name_last,
              requesterUserID: user.user_id,
            },
          },
          date: friendRequest.appMessageDateNewFriendRequest,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getNewFriendRequestMessages', err.code || 520, err.name || 'unhandledError_messages-getNewFriendRequestMessages', err.isOperational || false, err.severity || 2);
    }
  }

  // get messages for 'followeePublicRecipeCreated' events
  async function getfolloweePublicRecipeCreatedMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      // get any entries from 'messages' table where 'userID' is the follower and 'type' is 'followeePublicRecipeCreated' and 'status' is not 'deleted'
      const { data: messageRows, error } = await db.from('messages').select().eq('userID', userID).eq('type', 'followeePublicRecipeCreated').neq('status', 'deleted');
      if (error) {
        throw errorGen(`Error getting messageRows: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let message of messageRows) {
        messages.push({
          type: 'followeePublicRecipeCreated',
          messageData: {
            title: message.title,
            message: message.message,
            status: message.status,
            data: {
              messageID: message.messageID,
              recipeID: message.dataNum1,
              recipeName: message.dataStr1,
              followeeName: message.dataStr2,
            },
          },
          date: message.createdTime,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getFolloweePublicRecipeCreatedMessages', err.code || 520, err.name || 'unhandledError_messages-getFolloweePublicRecipeCreatedMessages', err.isOperational || false, err.severity || 2);
    }
  }

  // get messages for 'friendHeirloomRecipeCreated' events
  async function getFriendHeirloomRecipeCreatedMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen(`userID is required`, 510, 'dataValidationErr', false, 3);
      }

      // get any entries from 'messages' table where 'userID' is the userID and 'type' is 'friendHeirloomRecipeCreated' and 'status' is not 'deleted'
      const { data: messageRows, error } = await db.from('messages').select().eq('userID', userID).eq('type', 'friendHeirloomRecipeCreated').neq('status', 'deleted');
      if (error) {
        throw errorGen(`Error getting messageRows: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      const messages = [];
      for (let message of messageRows) {
        messages.push({
          type: 'friendHeirloomRecipeCreated',
          messageData: {
            title: message.title,
            message: message.message,
            status: message.status,
            data: {
              messageID: message.messageID,
              recipeID: message.dataNum1,
              recipeName: message.dataStr1,
              friendName: message.dataStr2,
            },
          },
          date: message.createdTime,
        });
      }

      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getFriendHeirloomRecipeCreatedMessages', err.code || 520, err.name || 'unhandledError_messages-getFriendHeirloomRecipeCreatedMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function getWelcomeMessage(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      // get any entries from 'messages' table where 'userID' is the userID and 'type' is 'welcomeToDoughly' and 'status' is not 'deleted'
      const { data: messageRows, error } = await db.from('messages').select().eq('userID', userID).eq('type', 'welcomeToDoughly').neq('status', 'deleted');
      if (error) {
        throw errorGen(`Error getting messageRows: ${error.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      const messages = [];
      for (let message of messageRows) {
        messages.push({
          type: 'welcomeToDoughly',
          messageData: {
            title: message.title,
            message: message.message,
            status: message.status,
            data: {
              messageID: message.messageID,
            },
          },
          date: message.createdTime,
        });
      }
      return messages;
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages getWelcomeMessage', err.code || 520, err.name || 'unhandledError_messages-getWelcomeMessage', err.isOperational || false, err.severity || 2);
    }
  }

  async function add(options) {
    const { userID, message } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      switch (message.type) {
        case 'addFolloweePublicRecipeCreatedMessages':
          await addFolloweePublicRecipeCreatedMessages({ userID, recipeID: message.recipeID, recipeTitle: message.recipeTitle });
          break;
        case 'addFriendHeirloomRecipeCreatedMessages':
          await addFriendHeirloomRecipeCreatedMessages({ userID, recipeID: message.recipeID, recipeTitle: message.recipeTitle });
          break;
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages add', err.code || 520, err.name || 'unhandledError_messages-add', err.isOperational || false, err.severity || 2);
    }
  }

  // get messages for 'lowStock' events

  // get messages for 'upcomingStockExpiration' events

  async function addFolloweePublicRecipeCreatedMessages(options) {
    const { userID, recipeID, recipeTitle } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      // get profile of the user (recipe author)
      const { data: authorProfile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', userID).single();
      if (profileError) {
        throw errorGen(`Error getting profile: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      // get all followers of the user
      const { data: followships, error: followshipsError } = await db.from('followships').select().eq('following', userID).eq('deleted', false);
      if (followshipsError) {
        throw errorGen(`Error getting followships: ${followshipsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // for each follower, add a message to 'messages' table
      for (let followship of followships) {
        // update status of existing messages with this recipeID and 'type' is 'followeePublicRecipeCreated' and 'status' is not 'deleted'
        const { error: updateMessagesError } = await db.from('messages').update({ status: 'deleted' }).eq('userID', followship.userID).in('type', ['friendHeirloomRecipeCreated', 'followeePublicRecipeCreated']).eq('dataNum1', Number(recipeID)).neq('status', 'deleted');
        if (updateMessagesError) {
          throw errorGen(`Error updating messages: ${updateMessagesError.message}`, 513, 'failSupabaseUpdate', true, 3);
        }

        // add a message to 'messages' table
        const newMessageID = await generateIDFunction(75);
        const { error: addMessageError } = await db.from('messages').insert({
          messageID: Number(newMessageID),
          userID: followship.userID,
          createdTime: new Date().toISOString(),
          type: 'followeePublicRecipeCreated',
          title: `New Recipe from ${authorProfile.username}`,
          message: `${authorProfile.username} has made '${recipeTitle}' public.`,
          dataNum1: Number(recipeID),
          dataStr1: recipeTitle,
          dataStr2: authorProfile.username,
          status: 'notAcked',
        });
        if (addMessageError) {
          throw errorGen(`Error adding message: ${addMessageError.message}`, 512, 'failSupabaseInsert', true, 3);
        }
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages addFolloweePublicRecipeCreatedMessages', err.code || 520, err.name || 'unhandledError_messages-addFolloweePublicRecipeCreatedMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function addFriendHeirloomRecipeCreatedMessages(options) {
    const { userID, recipeID, recipeTitle } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      // get profile of the user (recipe author)
      const { data: authorProfile, error: profileError } = await dbPublic.from('profiles').select().eq('user_id', userID).single();
      if (profileError) {
        throw errorGen(`Error getting profile: ${profileError.message}`, 511, 'failSupabaseSelect', true, 3);
      }
      // get all friends of the user
      const { data: friendships, error: friendshipsError } = await db.from('friendships').select().eq('userID', userID).eq('deleted', false).eq('status', 'confirmed');
      if (friendshipsError) {
        throw errorGen(`Error getting friendships: ${friendshipsError.message}`, 511, 'failSupabaseSelect', true, 3);
      }

      // for each friend, add a message to 'messages' table
      for (let friendship of friendships) {
        // update status of existing messages with this recipeID and 'type' is 'friendHeirloomRecipeCreated' and 'status' is not 'deleted'
        const { error: updateMessagesError } = await db.from('messages').update({ status: 'deleted' }).eq('userID', friendship.friend).in('type', ['friendHeirloomRecipeCreated', 'followeePublicRecipeCreated']).eq('dataNum1', Number(recipeID)).neq('status', 'deleted');
        if (updateMessagesError) {
          throw errorGen(`Error updating messages: ${updateMessagesError.message}`, 513, 'failSupabaseUpdate', true, 3);
        }
        // add a message to 'messages' table
        const newMessageID = await generateIDFunction(75);
        const { error: addMessageError } = await db.from('messages').insert({
          messageID: Number(newMessageID),
          createdTime: new Date().toISOString(),
          userID: friendship.friend,
          type: 'friendHeirloomRecipeCreated',
          title: `New Heirloom Recipe from ${authorProfile.username}`,
          message: `${authorProfile.username} has shared '${recipeTitle}' with friends.`,
          dataNum1: Number(recipeID),
          dataStr1: recipeTitle,
          dataStr2: authorProfile.username,
          status: 'notAcked',
        });
        if (addMessageError) {
          throw errorGen(`Error adding message: ${addMessageError.message}`, 512, 'failSupabaseInsert', true, 3);
        }
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages addFriendHeirloomRecipeCreatedMessages', err.code || 520, err.name || 'unhandledError_messages-addFriendHeirloomRecipeCreatedMessages', err.isOperational || false, err.severity || 2);
    }
  }

  async function addWelcomeMessage(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      // add a message to 'messages' table
      const newMessageID = await generateIDFunction(75);
      const { error: addMessageError } = await db.from('messages').insert({
        messageID: Number(newMessageID),
        createdTime: new Date().toISOString(),
        userID: userID,
        type: 'welcomeToDoughly',
        title: 'Welcome to Doughly',
        message: `We are excited for you to create and share the important recipes in your life with your friends and family. Happy cooking!`,
        status: 'notAcked',
      });
      if (addMessageError) {
        throw errorGen(`Error adding message: ${addMessageError.message}`, 512, 'failSupabaseInsert', true, 3);
      }
    } catch (err) {
      throw errorGen(err.message || 'Unhandled Error in messages addWelcomeMessage', err.code || 520, err.name || 'unhandledError_messages-addWelcomeMessage', err.isOperational || false, err.severity || 2);
    }
  }

  return {
    get: {
      all: getAllMessages,
    },
    acknowledge: acknowledgeMessage,
    delete: deleteMessage,
    addFolloweePublicRecipeCreatedMessages,
    addFriendHeirloomRecipeCreatedMessages,
    addWelcomeMessage,
    add,
  };
};
