const jwt = require('jsonwebtoken');

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Authorization: 'Bearer TOKEN'

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.userID = user.id;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}
