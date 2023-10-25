const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_DOUGHLEAP_URL;
const key = process.env.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(url, key, { db: { schema: 'bakery' } });

const updater = async (IDfield, ID, table, updateFields) => {
  //make a query to supabase to update the record
  const updateQuery = supabase
    .from(table)
    .update(updateFields)
    .match({ [IDfield]: ID })
    .select('*');

  const { data, error } = await updateQuery;
  if (error) {
    global.logger.info(`Error updating ID:${ID} in table:${table} ${error.message}`);
    return { error: error.message };
  } else {
    global.logger.info(`Updated ${table}, ID: ${ID}`);
    return data[0];
  }
};

const incrementVersion = async (table, IDfield, ID, currentVersion) => {
  //make a query to supabase to increment the version
  const updateQuery = supabase
    .from(table)
    .update({ version: currentVersion + 1 })
    .match({ [IDfield]: ID })
    .select('version');

  const { data, error } = await updateQuery;
  if (error) {
    global.logger.info(`Error incrementing version of ID:${ID} in table:${table} ${error.message}`);
    return { error: error.message };
  } else {
    global.logger.info(`Incremented version of ${table}, ID: ${ID}`);
    return data[0].version;
  }
};

module.exports = { supabase, updater, incrementVersion };
