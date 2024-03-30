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
    const message = {
      data: payload.message,
      notification: payload.notification,
      android: payload.android,
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
