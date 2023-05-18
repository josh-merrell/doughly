const { createClient } = require('@supabase/supabase.js');
const fs = require('fs');
const path = require('path');
const { set } = require('lodash');

const url = process.env.SUPABASE_DOUGHLEAP_URL;
const key = process.env.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(url, key);

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

const normalizePath = (p) => p.replace(/\\/gm, '/');

function walkDir(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = normalizePath(path.resolve(dir, dirent.name));
    return dirent.isDirectory() ? walkDir(res) : res;
  });
  return Array.prototype.concat(...files);
}

const requireSQL = (dir) => {
  const returner = {};

  const rawPaths = walkDir(dir);

  const currentPath = `${normalizePath(path.resolve(path.normalize(dir)))}/`;

  const paths = rawPaths.filter((f) => f.endsWith(`.sql`));

  for (const p of paths) {
    const subtracted = p.replace(currentPath, '');
    const dotted = subtracted.replace(/\.sql/gm, '').replace(/\//gm, '.');
    const sqlFile = fs.readFileSync(p).toString();
    set(returner, dotted, sqlFile);
  }
  return returner;
};

module.exports = { supabase, verifyUser, updater, requireSQL };
