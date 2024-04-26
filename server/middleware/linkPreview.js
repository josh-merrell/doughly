const userAgentRedirect = (req, res, next) => {
  global.logger.info(`USER AGENT REDIRECT MIDDLEWARE. REQ: ${req.url}, USER AGENT: ${req.headers['user-agent']}`);
  // if user agent is not in the following list, redirect to the production app
  const userAgent = req.headers['user-agent'];

  const allowedUserAgents = [/facebookexternalhit/, /Facebot/, /Twitterbot/, /WhatsApp/, /PostmanRuntime/, /TelegramBot/, /Slackbot/, /LinkedInBot/, /Pinterest/];

  let redirectLink = process.env.NODE_ENV === 'production' ? 'https://doughly.co' : 'localhost:4200';

  const mobileUserAgents = [/Android/, /webOS/, /iPhone/, /iPad/, /iPod/, /BlackBerry/, /Windows Phone/, /Mobile/];

  if (mobileUserAgents.some((regex) => regex.test(userAgent))) {
    redirectLink = process.env.NODE_ENV === 'production' ? 'https://co.doughly.app' : 'localhost:4200';
  }

  const url = req.url.split('link-previews/')[1];
  // ex url: 'recipe/1124033100000001'. Need to check if url has 'recipe'
  if (!url.includes('recipe')) {
    const recipeID = url.split('/')[1];
    redirectLink = `${redirectLink}?recipeID=${recipeID}`;
  }

  const isAllowedUserAgent = (userAgent) => allowedUserAgents.some((regex) => regex.test(userAgent));

  if (!isAllowedUserAgent(userAgent)) {
    global.logger.info(`${req.headers['user-agent']} USER REQUEST, REDIRECTING TO ${redirectLink}`);
    return res.redirect(redirectLink);
  }

  // else continue on to get the preview details for the user agent
  global.logger.info(`${req.headers['user-agent']} ALLOWED, SENDING TO GET PREVIEW DETAILS`);
  next();
};

module.exports = { userAgentRedirect };
