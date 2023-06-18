const { createClient } = require('@supabase/supabase-js');

const authenticateJWT = async (req, res, next) => {
  const supabase = createClient(process.env.SUPABASE_DOUGHLEAP_URL, process.env.SUPABASE_DOUGHLEAP_KEY);

  const result = await supabase.auth.getUser(req.headers.authorization);

  if (result) {
    // The JWT token is valid, and 'user' contains the authenticated user's info.
    req.userID = result.data.user.id;
    next();
  } else {
    // The JWT token is invalid or missing.
    res.sendStatus(401);
  }
};

module.exports = {
  authenticateJWT,
};
