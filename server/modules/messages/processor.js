const { errorGen } = require('../../middleware/errorHandling');
('use strict');

module.exports = ({ db }) => {
  async function getAllMessages(options) {
    const { userID } = options;
    if (!userID) {
      throw errorGen('userID is required', 400);
    }

    const messages = [];
    messages.append(await getIngredientStockExpiredMessages({ userID }));
    messages.append(await getIngredientOutOfStockMessages({ userID }));
    messages.append(await getNewFollowerMessages({ userID }));
    messages.append(await getNewFriendMessages({ userID }));
    messages.append(await getNewFriendRequestMessages({ userID }));

    return messages;
  }

  async function acknowledgeMessage(options) {
    const { userID, message } = options;
    if (!userID) {
      throw errorGen('userID is required', 400);
    }

    try {
      switch (message.type) {
        case 'ingredientStockExpired':
          await db.from('ingredientStocks').update({ appMessage: 'acked' }).eq('userID', userID).eq('ingredientStockID', message.data.ingredientStockID);
          break;
        case 'ingredientOutOfStock':
          await db.from('ingredients').update({ appMessage: 'acked' }).eq('userID', userID).eq('ingredientID', message.data.ingredientID);
          break;
        case 'newFollower':
          await db.from('followships').update({ appMessage: 'acked' }).eq('followshipID', message.data.followshipID);
          break;
        case 'newFriend':
          await db.from('friendships').update({ appMessageNewFriend: 'acked' }).eq('friendshipID', message.data.friendshipID);
          break;
        case 'newFriendRequest':
          await db.from('friendRequests').update({ appMessageNewFriendRequest: 'acked' }).eq('friendRequestID', message.data.friendRequestID);
          break;
        default:
          throw errorGen('Invalid message type', 400);
      }
    } catch (e) {
      global.logger.error(`'messages' 'acknowledgeMessage': ${e.message}`);
      throw errorGen('Error acknowledging message', 500);
    }
  }

  async function deleteMessage(options) {
    const { userID, message } = options;
    if (!userID) {
      throw errorGen('userID is required', 400);
    }

    try {
      switch (message.type) {
        case 'ingredientStockExpired':
          await db.from('ingredientStocks').update({ appMessage: null }).eq('userID', userID).eq('ingredientStockID', message.data.ingredientStockID);
          break;
        case 'ingredientOutOfStock':
          await db.from('ingredients').update({ appMessage: null }).eq('userID', userID).eq('ingredientID', message.data.ingredientID);
          break;
        case 'newFollower':
          await db.from('followships').update({ appMessage: null }).eq('followshipID', message.data.followshipID);
          break;
        case 'newFriend':
          await db.from('friendships').update({ appMessageNewFriend: null }).eq('friendshipID', message.data.friendshipID);
          break;
        case 'newFriendRequest':
          await db.from('friendRequests').update({ appMessageNewFriendRequest: null }).eq('friendRequestID', message.data.friendRequestID);
          break;
        default:
          throw errorGen('Invalid message type', 400);
      }
    } catch (e) {
      global.logger.error(`'messages' 'deleteMessage': ${e.message}`);
      throw errorGen('Error deleting message', 500);
    }
  }

  async function getIngredientStockExpiredMessages(options) {
    const { userID } = options;
    if (!userID) {
      throw errorGen('userID is required', 400);
    }

    try {
      const { data: ingredientStocks, error } = await db.from('ingredientStocks').select().eq('userID', userID).in('appMessage', ['notAcked', 'acked']);
      if (error) {
        global.logger.error(`Error getting ingredientStocks: ${error.message}`);
        throw errorGen('Error getting ingredientStocks', 500);
      }

      const messages = [];
      for (let ingredientStock of ingredientStocks) {
        const { data: ingredient, error: ingredientError } = await db.from('ingredients').select().eq('ingredientID', ingredientStock.ingredientID).single();
        if (ingredientError) {
          global.logger.error(`Error getting ingredient: ${ingredientError.message}`);
          throw errorGen('Error getting ingredient', 500);
        }
        const measurement = ingredientStock.measurement / ingredient.gramRatio;
        messages.append({
          type: 'ingredientStockExpired',
          messageData: {
            title: 'Ingredient Stock Expired',
            message: `${measurement} ${ingredient.measurementUnit} of ${ingredient.name} has expired.`,
            data: {
              ingredientStockID: ingredientStock.ingredientStockID,
              ingredientID: ingredientStock.ingredientID,
              ingredientName: ingredient.name,
              measurement,
              measurementUnit: ingredient.measurementUnit,
            },
          },
          date: ingredientStock.appMessageDate,
        });
      }

      return messages;
    } catch (e) {
      global.logger.error(`'messages' 'getIngredientStockExpiredMessages': ${e.message}`);
      throw errorGen('Error getting ingredientStockExpired messages', 500);
    }
  }

  return {
    get: {
      all: getAllMessages,
    },
    acknowledge: acknowledgeMessage,
    delete: deleteMessage,
  };
};
