const { errorGen } = require('../../middleware/errorHandling');
const { generateIDFunction } = require('../../middleware/ID');
('use strict');

module.exports = ({ db, dbPublic }) => {
  async function getAllMessages(options) {
    const { userID } = options;

    try {
      global.logger.info(`Getting all messages for user ${options.userID}`);
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      // get 'lastMessageSyncTime' from profile
      const { data: profile, error: profileError } = await dbPublic.from('profiles').select('lastMessageSyncTime').eq('user_id', userID).single();
      if (profileError) {
        global.logger.error(`Error getting profile: ${profileError.message}`);
        throw errorGen('Error getting profile', 500);
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
          // Log or handle the error as needed
          global.logger.error(`Error in fetching messages: ${result.reason}`);
          throw errorGen('Error in fetching messages', 500);
        }
      }

      // update 'lastMessageSyncTime' in profile (timestampz)
      const { error: updateError } = await dbPublic.from('profiles').update({ lastMessageSyncTime: new Date().toISOString() }).eq('user_id', userID);
      if (updateError) {
        global.logger.error(`Error updating lastMessageSyncTime: ${updateError.message}`);
        throw errorGen('Error updating lastMessageSyncTime', 500);
      }

      return messages;
    } catch (err) {
      throw errorGen('Unhandled Error in messages getAllMessages', 520, 'unhandledError_messages-getAllMessages', false, 2); //message, code, name, operational, severity
    }
  }

  async function acknowledgeMessage(options) {
    const { userID, message } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      global.logger.info(`Acknowledging message ${message.type} for user ${userID}`);

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
          throw errorGen('Invalid message type', 400);
      }
      return {
        result: 'success',
      };
    } catch (err) {
      throw errorGen('Unhandled Error in messages acknowledgeMessage', 520, 'unhandledError_messages-acknowledgeMessage', false, 2); //message, code, name, operational, severity
    }
  }

  async function deleteMessage(options) {
    const { userID, message } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      global.logger.info(`Deleting message ${message.type} for user ${userID}`);
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
          throw errorGen('Invalid message type', 400);
      }
      return {
        result: 'success',
      };
    } catch (err) {
      throw errorGen('Unhandled Error in messages deleteMessage', 520, 'unhandledError_messages-deleteMessage', false, 2); //message, code, name, operational, severity
    }
  }

  async function getIngredientStockExpiredMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      const { data: ingredientStocks, error } = await db.from('ingredientStocks').select().eq('userID', userID).eq('deleted', false).in('appMessageStatus', ['notAcked', 'acked']);
      if (error) {
        global.logger.error(`Error getting ingredientStocks: ${error.message}`);
        throw errorGen('Error getting ingredientStocks', 500);
      }

      const messages = [];
      for (let ingredientStock of ingredientStocks) {
        if (!ingredientStock.appMessageDate) {
          global.logger.info(`IngredientStockExpired message missing date`);
          continue;
        }
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientStock.ingredientID).single();
        if (ingredientError) {
          global.logger.error(`Error getting ingredient: ${ingredientError.message}`);
          throw errorGen('Error getting ingredient', 500);
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
      throw errorGen('Unhandled Error in messages getIngredientStockExpiredMessages', 520, 'unhandledError_messages-getIngredientStockExpiredMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting ingredients: ${error.message}`);
        throw errorGen('Error getting ingredients', 500);
      }

      const messages = [];
      for (let ingredient of ingredients) {
        if (!ingredient.appMessageDate) {
          global.logger.info(`IngredientOutOfStock message missing date`);
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
      throw errorGen('Unhandled Error in messages getIngredientOutOfStockMessages', 520, 'unhandledError_messages-getIngredientOutOfStockMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting followships: ${error.message}`);
        throw errorGen('Error getting followships', 500);
      }

      const messages = [];
      for (let followship of followships) {
        if (!followship.appMessageDate) {
          global.logger.info(`NewFollower message missing date`);
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', followship.userID).single();
        if (userError) {
          global.logger.error(`Error getting follower profile: ${userError.message}`);
          throw errorGen('Error getting follower profile', 500);
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
      throw errorGen('Unhandled Error in messages getNewFollowerMessages', 520, 'unhandledError_messages-getNewFollowerMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting friendships: ${error.message}`);
        throw errorGen('Error getting friendships', 500);
      }

      const messages = [];
      for (let friendship of friendships) {
        if (!friendship.appMessageDateNewFriend) {
          global.logger.info(`NewFriend message missing date`);
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', friendship.friend).single();
        if (userError) {
          global.logger.error(`Error getting friend profile: ${userError.message}`);
          throw errorGen('Error getting friend profile', 500);
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
      throw errorGen('Unhandled Error in messages getNewFriendMessages', 520, 'unhandledError_messages-getNewFriendMessages', false, 2); //message, code, name, operational, severity
    }
  }

  async function getNewFriendRequestMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }
      const { data: friendRequests, error } = await db.from('friendships').select().eq('userID', userID).eq('deleted', false).in('appMessageStatusNewFriendRequest', ['notAcked', 'acked']);
      if (error) {
        global.logger.error(`Error getting friendRequests: ${error.message}`);
        throw errorGen('Error getting friendRequests', 500);
      }

      const messages = [];
      for (let friendRequest of friendRequests) {
        if (!friendRequest.appMessageDateNewFriendRequest) {
          global.logger.info(`NewFriendRequest message missing date`);
          continue;
        }
        const { data: user, error: userError } = await dbPublic.from('profiles').select().eq('user_id', friendRequest.friend).single();
        if (userError) {
          global.logger.error(`Error getting friendRequest profile: ${userError.message}`);
          throw errorGen('Error getting friendRequest profile', 500);
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
      throw errorGen('Unhandled Error in messages getNewFriendRequestMessages', 520, 'unhandledError_messages-getNewFriendRequestMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting messageRows: ${error.message}`);
        throw errorGen('Error getting messageRows', 500);
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
      throw errorGen('Unhandled Error in messages getFolloweePublicRecipeCreatedMessages', 520, 'unhandledError_messages-getFolloweePublicRecipeCreatedMessages', false, 2); //message, code, name, operational, severity
    }
  }

  // get messages for 'friendHeirloomRecipeCreated' events
  async function getFriendHeirloomRecipeCreatedMessages(options) {
    const { userID } = options;

    try {
      if (!userID) {
        throw errorGen('userID is required', 400);
      }

      // get any entries from 'messages' table where 'userID' is the userID and 'type' is 'friendHeirloomRecipeCreated' and 'status' is not 'deleted'
      const { data: messageRows, error } = await db.from('messages').select().eq('userID', userID).eq('type', 'friendHeirloomRecipeCreated').neq('status', 'deleted');
      if (error) {
        global.logger.error(`Error getting messageRows: ${error.message}`);
        throw errorGen('Error getting messageRows', 500);
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
      throw errorGen('Unhandled Error in messages getFriendHeirloomCreatedMessages', 520, 'unhandledError_messages-getFriendHeirloomCreatedMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting messageRows: ${error.message}`);
        throw errorGen('Error getting messageRows', 500);
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
      throw errorGen('Unhandled Error in messages getWelcomeMessage', 520, 'unhandledError_messages-getWelcomeMessage', false, 2); //message, code, name, operational, severity
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
      throw errorGen('Unhandled Error in messages add', 520, 'unhandledError_messages-add', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting profile: ${profileError.message}`);
        throw errorGen('Error getting profile', 500);
      }
      // get all followers of the user
      const { data: followships, error: followshipsError } = await db.from('followships').select().eq('following', userID).eq('deleted', false);
      if (followshipsError) {
        global.logger.error(`Error getting followships: ${followshipsError.message}`);
        throw errorGen('Error getting followships', 500);
      }

      // for each follower, add a message to 'messages' table
      for (let followship of followships) {
        // update status of existing messages with this recipeID and 'type' is 'followeePublicRecipeCreated' and 'status' is not 'deleted'
        const { error: updateMessagesError } = await db.from('messages').update({ status: 'deleted' }).eq('userID', followship.userID).in('type', ['friendHeirloomRecipeCreated', 'followeePublicRecipeCreated']).eq('dataNum1', Number(recipeID)).neq('status', 'deleted');
        if (updateMessagesError) {
          global.logger.error(`Error updating messages: ${updateMessagesError.message}`);
          throw errorGen('Error updating messages', 500);
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
          global.logger.error(`Error adding message: ${addMessageError.message}`);
          throw errorGen('Error adding message', 500);
        }
      }
    } catch (err) {
      throw errorGen('Unhandled Error in messages addFolloweePublicRecipeCreatedMessages', 520, 'unhandledError_messages-addFolloweePublicRecipeCreatedMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error getting profile: ${profileError.message}`);
        throw errorGen('Error getting profile', 500);
      }
      // get all friends of the user
      const { data: friendships, error: friendshipsError } = await db.from('friendships').select().eq('userID', userID).eq('deleted', false).eq('status', 'confirmed');
      if (friendshipsError) {
        global.logger.error(`Error getting friendships: ${friendshipsError.message}`);
        throw errorGen('Error getting friendships', 500);
      }

      // for each friend, add a message to 'messages' table
      for (let friendship of friendships) {
        // update status of existing messages with this recipeID and 'type' is 'friendHeirloomRecipeCreated' and 'status' is not 'deleted'
        const { error: updateMessagesError } = await db.from('messages').update({ status: 'deleted' }).eq('userID', friendship.friend).in('type', ['friendHeirloomRecipeCreated', 'followeePublicRecipeCreated']).eq('dataNum1', Number(recipeID)).neq('status', 'deleted');
        if (updateMessagesError) {
          global.logger.error(`Error updating messages: ${updateMessagesError.message}`);
          throw errorGen('Error updating messages', 500);
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
          global.logger.error(`Error adding message: ${addMessageError.message}`);
          throw errorGen('Error adding message', 500);
        }
      }
    } catch (err) {
      throw errorGen('Unhandled Error in messages addFriendHeirloomRecipeCreatedMessages', 520, 'unhandledError_messages-addFriendHeirloomRecipeCreatedMessages', false, 2); //message, code, name, operational, severity
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
        global.logger.error(`Error adding message: ${addMessageError.message}`);
        throw errorGen('Error adding message', 500);
      }
    } catch (err) {
      throw errorGen('Unhandled Error in messages addWelcomeMessage', 520, 'unhandledError_messages-addWelcomeMessage', false, 2); //message, code, name, operational, severity
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
