const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const serviceAccount = require('./doughly-d93badfe1987.json');

const app = initializeApp({
  // credential: applicationDefault(),
  credential: cert(serviceAccount),
});

async function sendTokenNotifications(destTokens, type, data) {
  for (const token of destTokens) {
    const payload = getPayload(type, data);
    // const message = {
    //   data: payload.message,
    //   notification: payload.notification,
    //   android: payload.android,
    //   token,
    // };
    const message = {
      notification: {
        title: 'PING',
        body: 'You have a new ping!',
      },
      android: {
        notification: {
          imageUrl: 'https://s3.us-west-2.amazonaws.com/dl.images/recipe/a525810e-5531-4f97-95a4-39a082f7416b/beef-broccoli.jpg',
        },
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
          },
        },
        fcm_options: {
          image: 'https://s3.us-west-2.amazonaws.com/dl.images/recipe/a525810e-5531-4f97-95a4-39a082f7416b/beef-broccoli.jpg',
        },
      },
      webpush: {
        headers: {
          image: 'https://s3.us-west-2.amazonaws.com/dl.images/recipe/a525810e-5531-4f97-95a4-39a082f7416b/beef-broccoli.jpg',
        },
      },
      token,
    };
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
        // message: { score: data['score'] },
        notification: {
          title: 'Ping!',
          body: 'You have a new ping!',
        },
        android: {
          notification: {
            imageUrl: data['imageUrl'],
          },
        },
      };
    default:
      return {
        message: `default message`,
      };
  }
}

module.exports = {
  sendTokenNotifications,
};
