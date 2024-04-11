const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./doughly-d93badfe1987.json');

const app = initializeApp({
  credential: cert(serviceAccount),
});

async function sendTokenNotifications(destTokens, type, data) {
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
    global.logger.info(`Sending token message: ${JSON.stringify(message)}`);
    await sendTokenNotification(message);
  }
}

async function sendTokenNotification(message) {
  const messaging = getMessaging(app);
  await messaging
    .send(message)
    .then((response) => {
      global.logger.info('Successfully sent token message:', response);
    })
    .catch((error) => {
      global.logger.error('Error sending message:', error);
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
    case 'notifyFollowersPublicRecipeCreated':
      return {
        message: {
          newRecipe: `${data['recipeAuthor']} published a new recipe: ${data['recipeName']}`,
        },
        notification: {
          title: 'New Recipe on Doughly',
          body: `Check out ${data.recipeName}, a new public recipe published by ${data.recipeAuthor}, who you follow!`,
        },
      };
    case 'notifyFriendsHeirloomRecipeCreated':
      return {
        message: {
          newRecipe: `${data['recipeAuthor']} published a new recipe: ${data['recipeName']}`,
        },
        notification: {
          title: 'New Recipe on Doughly',
          body: `You've got the inside scoop. ${data.recipeAuthor} just shared a new recipe; ${data.recipeName}, for friends only!`,
        },
      };
    case 'notifyNewFollower':
      return {
        message: {
          newFollower: `${data['followerName']} started following you!`,
        },
        notification: {
          title: 'New Follower',
          body: `${data.followerName} is now following you`,
        },
      };
    case 'notifyRequestFriendship':
      return {
        message: {
          friendRequest: `${data['requesterName']} sent you a friend request!`,
        },
        notification: {
          title: 'Friend Request',
          body: `${data.requesterName} wants to be your friend`,
        },
      };
    case 'notifyConfirmFriendship':
      return {
        message: {
          friendRequest: `${data['friendName']} accepted your friend request!`,
        },
        notification: {
          title: 'Friend Request Accepted',
          body: `${data.friendName} accepted your friend request`,
        },
      };
    case 'autoDeletedExpiredStock':
      return {
        message: {
          message: 'Auto Deleted Expired Ingredient Inventory',
        },
        notification: {
          title: 'Expired Ingredient Auto Deleted',
          body: `${data['measurement']} ${data['measurementUnit']} of expired ${data['name']} was auto removed from your kitchen`,
        },
      };
    case 'autoDeletedExpiredStocks':
      return {
        message: {
          message: 'Auto Deleted Expired for Multiple Ingredients',
        },
        notification: {
          title: 'Multiple Expired Ingredients Auto Deleted',
          body: `${data['name']}, and ${data['count'] - 1} other ingredients had expired inventory auto removed from your kitchen`,
        },
      };
    case 'noStock':
      return {
        message: {
          message: 'No Stock',
        },
        notification: {
          title: `No ${data['name']} Stock`,
          body: `You have no remaining stock of ${data['name']} in your kitchen`,
        },
      };
    case 'lowStock':
      return {
        message: {
          message: 'Low Stock',
        },
        notification: {
          title: `Low ${data['name']} Stock`,
          body: `${data['count']} of your recipes require more ${data['name']} than you have in your kitchen`,
        },
      };
    case 'upcomingStockExpiration':
      return {
        message: {
          message: 'Ingredient Expires Soon',
        },
        notification: {
          title: 'Ingredient Expires Soon',
          body: `${data['measurement']} ${data['measurementUnit']} of ${data['name']} will expire soon`,
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
