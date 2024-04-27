const userAgentRedirect = (req, res, next) => {
  global.logger.info(`USER AGENT REDIRECT MIDDLEWARE. REQ: ${req.url}, USER AGENT: ${req.headers['user-agent']}`);
  // if user agent is not in the following list, redirect to the production app
  const userAgent = req.headers['user-agent'];

  const allowedUserAgents = [/facebookexternalhit/, /Facebot/, /Twitterbot/, /WhatsApp/, /PostmanRuntime/, /TelegramBot/, /Slackbot/, /LinkedInBot/, /Pinterest/];

  let redirectLink = process.env.NODE_ENV === 'production' ? 'https://doughly.co' : 'localhost:4200';

  global.logger.info(`REDIRECT LINK INITIAL: ${redirectLink}`);

  const mobileUserAgents = [/Android/, /webOS/, /iPhone/, /iPad/, /iPod/, /BlackBerry/, /Windows Phone/, /Mobile/];

  if (mobileUserAgents.some((regex) => regex.test(userAgent))) {
    global.logger.info(`REDIRECT LINK FOR MOBILE: ${redirectLink}`);
    // ex url: 'recipe/1124033100000001'. Need to check if url has 'recipe'
    if (req.url.includes('recipe')) {
      const recipeID = req.url.split('recipe/')[1];
      redirectLink = `${redirectLink}/recipe/public/${recipeID}`;
    }
    global.logger.info(`${req.headers['user-agent']} USER REQUEST, REDIRECTING TO ${redirectLink}`);
    return res.redirect(redirectLink);
  }

  const isAllowedUserAgent = (userAgent) => allowedUserAgents.some((regex) => regex.test(userAgent));

  // else continue on to get the preview details for the user agent
  if (isAllowedUserAgent(userAgent)) {
    global.logger.info(`${req.headers['user-agent']} ALLOWED, SENDING TO GET PREVIEW DETAILS`);
    next();
  } else {
    // else drop the request
    global.logger.info(`${req.headers['user-agent']} NOT USER OR LINK PREVIEW CRAWLER, DROP REQUEST`);
    return res.status(404).send('Not Found');
  }
};

module.exports = { userAgentRedirect };
