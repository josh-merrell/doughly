const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_DOUGHLEAP_URL;
const key = process.env.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(url, key, { db: { schema: 'bakery' } });

const verifyUser = async (req, res, next) => {
  const token = req.headers.token;
  const { data: payload, error } = await supabase.auth.api.getUser(token);
  if (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = payload;
  next();
};

const updater = async (clientID, table, updateFields) => {
  const updateQuery = supabase.from(table).update(updateFields).match({ clientID: clientID }).returning('*');

  const { data, error } = await updateQuery;
  if (error) {
    global.logger.info(`Error updating ${table}: ${error.message}`);
    return { error: error.message };
  } else {
    global.logger.info(`Updated ${table} ${clientID}`);
    return data;
  }
};

module.exports = { supabase, verifyUser, updater };
