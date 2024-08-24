const userAgentRedirect = (req, res, next) => {
  global.logger.info({ message: `*userAgentRedirect* USER AGENT REDIRECT MIDDLEWARE. REQ: ${req.url}, USER AGENT: ${req.headers['user-agent']}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
  // if user agent is not in the following list, redirect to the production app
  const userAgent = req.headers['user-agent'];

  const allowedUserAgents = [/facebookexternalhit/, /Facebot/, /Twitterbot/, /WhatsApp/, /PostmanRuntime/, /TelegramBot/, /Slackbot/, /LinkedInBot/, /Pinterest/];

  let redirectLink = process.env.NODE_ENV === 'production' ? 'https://doughly.co' : 'localhost:4200';

  global.logger.info({ message: `REDIRECT LINK INITIAL: ${redirectLink}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });

  const mobileUserAgents = [/Android/, /webOS/, /iPhone/, /iPad/, /iPod/, /BlackBerry/, /Windows Phone/, /Mobile/];

  if (mobileUserAgents.some((regex) => regex.test(userAgent))) {
    global.logger.info({ message: `*userAgentRedirect* REDIRECT LINK FOR MOBILE: ${redirectLink}`, level: 7, timestamp: new Date().toISOString(), userID: 0 });
    // ex url: 'recipe/1124033100000001'. Need to check if url has 'recipe'
    if (req.url.includes('recipe')) {
      const recipeID = req.url.split('recipe/')[1];
      redirectLink = `${redirectLink}/recipe/public/${recipeID}`;
    } else if (req.url.includes('invite')) {
      // if mobileUserAgent is Android or Blackberry, add "play-store" to the redirect link
      if (userAgent.includes('Android') || userAgent.includes('BlackBerry')) {
        redirectLink = `${process.env.PLAY_STORE_LINK}`;
      } else {
        redirectLink = `${process.env.APP_STORE_LINK}`;
      }
    }
    global.logger.info({ message: `*userAgentRedirect* ${req.headers['user-agent']} USER REQUEST, REDIRECTING TO ${redirectLink}`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return res.redirect(redirectLink);
  }

  const isAllowedUserAgent = (userAgent) => allowedUserAgents.some((regex) => regex.test(userAgent));

  // else continue on to get the preview details for the user agent
  if (isAllowedUserAgent(userAgent)) {
    global.logger.info({ message: `*userAgentRedirect* ${req.headers['user-agent']} ALLOWED, SENDING TO GET PREVIEW DETAILS`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    next();
  } else {
    // else drop the request
    global.logger.info({ message: `*userAgentRedirect* ${req.headers['user-agent']} NOT USER OR LINK PREVIEW CRAWLER, DROP REQUEST`, level: 6, timestamp: new Date().toISOString(), userID: 0 });
    return res.status(404).send('Not Found');
  }
};

module.exports = { userAgentRedirect };
