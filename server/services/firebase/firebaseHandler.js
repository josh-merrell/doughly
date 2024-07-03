const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { errorGen } = require('../../middleware/errorHandling');
const serviceAccount = require('./doughly-d93badfe1987.json');

const app = initializeApp({
  credential: cert(serviceAccount),
});

async function sendTokenNotifications(destTokens, type, data) {
  try {
    for (const token of destTokens) {
      const payload = getPayload(type, data);
      let message = {
        data: payload.message,
        notification: payload.notification,
        token: token.pushToken,
      };
      if (data['imageUrl']) {
        message = addImage(message, data['imageUrl']);
      }
      await sendTokenNotification(message);
    }
  } catch (err) {
    throw errorGen(err.message || 'Unhandled Error in firebaseHandler sendTokenNotifications', err.code || 520, err.name || 'unhandledError_firebaseHandler-sendTokenNotifications', err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
  }
}

async function sendTokenNotification(message) {
  global.logger.info({ message: `'sendTokenNotification' Sending Notification: ${JSON.stringify(message)}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
  const messaging = getMessaging(app);
  await messaging
    .send(message)
    .then((response) => {
      global.logger.info({ message: `Successfully sent token message: ${response}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    })
    .catch((err) => {
      throw errorGen(`${err.message} || Unhandled Error in firebaseHandler sendTokenNotification`, err.code || 520, `${err.name} || unhandledError_firebaseHandler-sendTokenNotification`, err.isOperational || false, err.severity || 2); //message, code, name, operational, severity
    });
}

function getPayload(type, data) {
  switch (type) {
    case 'ping':
      return {
        message: { score: data['score'] },
        notification: {
          title: 'Ping!',
          body: 'You have a new ping!',
        },
      };
    // Implemented
    case 'notifyFollowersPublicRecipeCreated':
      return {
        message: {
          type: 'followeePublicRecipeCreated',
          newRecipe: `${data['recipeAuthor']} published a new recipe: ${data['recipeName']}`,
          recipeID: String(data['recipeID']),
        },
        notification: {
          title: 'New Recipe on Doughly',
          body: `Check out ${data.recipeName}, a new public recipe published by ${data.recipeAuthor}, who you follow!`,
        },
      };
    // Implemented
    case 'notifyFriendsHeirloomRecipeCreated':
      return {
        message: {
          type: 'friendHeirloomRecipeCreated',
          newRecipe: `${data['recipeAuthor']} published a new recipe: ${data['recipeName']}`,
          recipeID: String(data['recipeID']),
        },
        notification: {
          title: 'New Recipe on Doughly',
          body: `You've got the inside scoop. ${data.recipeAuthor} just shared a new recipe; ${data.recipeName}, for friends only!`,
        },
      };
    // Implemented
    case 'notifyNewFollower':
      return {
        message: {
          type: 'newFollower',
          newFollower: `${data['followerName']} started following you!`,
          userID: String(data['followerUserID']),
        },
        notification: {
          title: 'New Follower',
          body: `${data.followerName} is now following you`,
        },
      };
    // Implemented
    case 'notifyRequestFriendship':
      return {
        message: {
          type: 'friendshipRequest',
          friendRequest: `${data['requesterName']} sent you a friend request!`,
          userID: String(data['requesterUserID']),
        },
        notification: {
          title: 'New Friend Request',
          body: `${data.requesterName} wants to be your friend`,
        },
      };
    case 'notifyConfirmFriendship':
      return {
        message: {
          type: 'friendshipConfirmation',
          friendRequest: `${data['friendName']} accepted your friend request!`,
          userID: String(data['friendUserID']),
        },
        notification: {
          title: 'New Friend',
          body: `${data.friendName} accepted your friend request`,
        },
      };
    // Implemented
    case 'autoDeletedExpiredStock':
      return {
        message: {
          type: 'autoDeletedExpiredStock',
          message: 'Auto Deleted Expired Ingredient Inventory',
        },
        notification: {
          title: 'Expired Ingredient Auto Deleted',
          body: `${data['measurement']} ${data['measurementUnit']} of expired ${data['name']} was auto removed from your kitchen`,
        },
      };
    // Implemented
    case 'autoDeletedExpiredStocks':
      return {
        message: {
          type: 'autoDeletedExpiredStocks',
          message: 'Auto Deleted Expired for Multiple Ingredients',
        },
        notification: {
          title: 'Multiple Expired Ingredients Auto Deleted',
          body: `${data['name']}, and ${data['count'] - 1} other ingredients had expired inventory auto removed from your kitchen`,
        },
      };
    // Implemented
    case 'noStock':
      return {
        message: {
          type: 'noStock',
          message: 'No Stock',
          ingredientID: String(data['ingredientID']),
        },
        notification: {
          title: `No ${data['name']} Stock`,
          body: `You have no remaining stock of ${data['name']} in your kitchen`,
        },
      };
    // Implemented
    case 'lowStock':
      return {
        message: {
          type: 'lowStock',
          message: 'Low Stock',
          ingredientID: String(data['ingredientID']),
        },
        notification: {
          title: `Low ${data['name']} Stock`,
          body: `${data['count']} of your recipes require more ${data['name']} than you have in your kitchen`,
        },
      };
    // Implemented
    case 'upcomingStockExpiration':
      return {
        message: {
          type: 'upcomingStockExpiration',
          message: 'Ingredient Expires Soon',
          ingredientID: String(data['ingredientID']),
        },
        notification: {
          title: 'Ingredient Expires Soon',
          body: `${data['measurement']} ${data['measurementUnit']} of ${data['name']} will expire soon`,
        },
      };
    // Implemented
    case 'notifyFriendListShare':
      return {
        message: {
          type: 'notifyFriendListShare',
          message: 'Shopping List Shared',
        },
        notification: {
          title: 'Shopping List Shared',
          body: `${data['friendUsername']} shared their shopping list with you`,
        },
      };
    case 'notifyFriendListProgress':
      return {
        message: {
          type: 'notifyFriendListProgress',
          message: 'Shopping List Progress',
        },
        notification: {
          title: 'Shopping List Progress',
          body: `${data['purchasedBy']} bought ${data['itemCount']} items from your shared shopping list`,
        },
      };

    default:
      return {
        message: `default message`,
      };
  }
}

function addImage(message, imageUrl) {
  message['android'] = {
    notification: {
      imageUrl: imageUrl,
    },
  };
  message['apns'] = {
    payload: {
      aps: {
        'mutable-content': 1,
      },
    },
    fcm_options: {
      image: imageUrl,
    },
  };
  message['webpush'] = {
    notification: {
      imageUrl: imageUrl,
    },
  };
  return message;
}

module.exports = {
  sendTokenNotifications,
};
