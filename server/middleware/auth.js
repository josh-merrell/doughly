const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  //parse the token from the header
  JSON.parse(authHeader);

  if (authHeader.access_token) {
    jwt.verify(authHeader.access_token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        global.logger.error(`Error while authenticating JWT: ${err.message}`);
        return res.sendStatus(403);
      }

      req.userID = user.id;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = {
  authenticateJWT,
};
