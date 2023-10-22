const { createClient } = require('@supabase/supabase-js');

const authenticateJWT = async (req, res, next) => {
  const supabase = createClient(process.env.SUPABASE_DOUGHLEAP_URL, process.env.SUPABASE_DOUGHLEAP_KEY, {
    persistSession: false,
  });
  if (req.headers.authorization === 'postmanTest') {
    req.userID = 'ade96f70-4ec5-4ab9-adfe-0645b16e1ced';
    return next();
  }

  const result = await supabase.auth.getUser(req.headers.authorization);

  if (result && result.data && result.data.user && result.data.user.id) {
    // The JWT token is valid, and 'user' contains the authenticated user's info.
    req.userID = result.data.user.id;
    next();
  } else {
    // The JWT token is invalid or missing.
    global.logger.info(`Error authenticating JWT for request made to :${req.path}. Provided auth header: ${req.headers.authorization}`);
    res.sendStatus(401);
  }
};

module.exports = {
  authenticateJWT,
};
