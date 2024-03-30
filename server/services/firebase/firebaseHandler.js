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
