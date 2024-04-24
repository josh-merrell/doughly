const userAgentRedirect = (req, res, next) => {
  global.logger.info(`USER AGENT REDIRECT MIDDLEWARE. REQ: ${req.url}, USER AGENT: ${req.headers['user-agent']}`);
  // if user agent is not in the following list, redirect to the production app
  const userAgent = req.headers['user-agent'];

  const allowedUserAgents = [/facebookexternalhit/, /Facebot/, /Twitterbot/, /WhatsApp/, /PostmanRuntime/, /TelegramBot/, /Slackbot/, /LinkedInBot/, /Pinterest/];

  const redirectLink = process.env.NODE_ENV === 'production' ? 'https://doughly.co' : 'localhost:4200';

  const isAllowedUserAgent = (userAgent) => allowedUserAgents.some((regex) => regex.test(userAgent));

  if (!isAllowedUserAgent(userAgent)) {
    return res.redirect(redirectLink);
  }

  // else continue on to get the preview details for the user agent
  global.logger.info(`${req.headers['user-agent']} ALLOWED, SENDING TO GET PREVIEW DETAILS`);
  next();
};

module.exports = { userAgentRedirect };
