//file adds supabase client to requests
const { createClient } = require('@supabase/supabase-js');
const { createKitchenLog, createRecipeLog, createUserLog, createShoppingLog } = require('./services/dbLogger');

const url = process.env.SUPABASE_DOUGHLEAP_URL;
const key = process.env.SUPABASE_DOUGHLEAP_KEY;

const supabase = createClient(url, key, { db: { schema: 'bakery' } });

const supabaseDefault = createClient(url, key);

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ error: 'No authorization token provided' });
    }
    const { user, error } = await supabase.auth.api.getUser(token);
    if (error || !user) {
      return res.status(401).send({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).send({ error: 'Internal Server Error while verifying user: ', err });
  }
};

const updater = async (userID, authorization, IDfield, ID, table, updateFields) => {
  //get existing values of updateFields from supabase
  const { data: existingRow, error: existingRowError } = await supabase
    .from(table)
    .select('*')
    .single()
    .match({ [IDfield]: ID });
  if (existingRowError) {
    global.logger.info(`Error getting existing row in table:${table} prior to updating. **${existingRowError.message}**`);
    return { error: existingRowError.message };
  }

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
  }
  let recipeVersion;
  if (existingRow.recipeID) {
    recipeVersion = await getRecipeVersion(existingRow.recipeID);
  }
  //add new log entry with old/new values for each field updated
  //select correct logger funcion based on table
  let logger;
  if (['ingredients', 'ingredientStocks', 'tools', 'toolStocks'].includes(table)) {
    logger = createKitchenLog;
  } else if (['recipes', 'recipeIngredients', 'recipeTools', 'steps', 'recipeSteps', 'recipeCategories', 'recipeComponents'].includes(table)) {
    logger = createRecipeLog;
  } else if (['persons', 'friendships'].includes(table)) {
    logger = createUserLog;
  } else if (['shoppingLists', 'shoppingListIngredients', 'shoppingListRecipes'].includes(table)) {
    logger = createShoppingLog;
  } else {
    global.logger.info(`In updater, don't know which logger to use based on provided table name: ${table}`);
    return { error: `In updater, don't know which logger to use based on provided table name: ${table}` };
  }
  //create needed log entries and version increments
  const logPromises = [];
  for (const [key, value] of Object.entries(updateFields)) {
    if (value !== existingRow[key]) {
      logPromises.push(
        logger(userID, authorization, `update${table.charAt(0).toUpperCase() + table.slice(1)}-${key}`, Number(ID), null, String(existingRow[key]), String(value), `updated ${key} of ${table} ID:${ID} from ${existingRow[key]} to ${value}`).then((logID1) => {
          const versionPromises = [];
          if (['recipeSteps', 'recipeIngredients', 'recipeTools', 'recipeComponents'].includes(table)) {
            versionPromises.push(
              incrementVersion('recipes', 'recipeID', existingRow.recipeID, recipeVersion).then((newVersion) =>
                createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(existingRow.recipeID), logID1, String(recipeVersion), String(newVersion), `updated version of recipe ID:${existingRow.recipeID} from ${recipeVersion} to ${newVersion}`),
              ),
            );
          }
          if (['steps', 'recipes', 'recipeTools', 'recipeIngredients', 'persons', 'friendships'].includes(table)) {
            versionPromises.push(
              incrementVersion(table, `${table.slice(0, -1)}ID`, ID, existingRow.version)
                .then((newVersion) => {
                  if (table !== 'persons') {
                    return createRecipeLog(userID, authorization, `update${table.charAt(0).toUpperCase() + table.slice(1, -1)}Version`, Number(ID), logID1, String(existingRow.version), String(newVersion), `updated version of ${table} ID:${ID} from ${existingRow.version} to ${newVersion}`);
                  } else {
                    return createUserLog(userID, authorization, `update${table.charAt(0).toUpperCase() + table.slice(1, -1)}Version`, Number(ID), logID1, String(existingRow.version), String(newVersion), `updated version of ${table} ID:${ID} from ${existingRow.version} to ${newVersion}`);
                  }
                })
                .then((logID2) => {
                  if (table === 'steps') {
                    return supabase
                      .from('recipeSteps')
                      .select()
                      .eq('stepID', ID)
                      .eq('deleted', false)
                      .then(({ data: relatedRecipeSteps, error: stepError }) => {
                        if (stepError) {
                          global.logger.info(`Error getting related recipeSteps for step to update: ${ID} : ${stepError.message}`);
                          return { error: stepError.message };
                        }
                        const stepPromises = relatedRecipeSteps.map((relatedRecipeStep) => {
                          return supabase
                            .from('recipes')
                            .select()
                            .eq('recipeID', relatedRecipeStep.recipeID)
                            .eq('deleted', false)
                            .single()
                            .then(({ data: recipe, error: recipeError }) => {
                              if (recipeError) {
                                global.logger.info(`Error getting associated recipe for recipeStepID: ${relatedRecipeStep.recipeStepID} prior to updating step ID: ${ID} : ${recipeError.message}`);
                                return { error: recipeError.message };
                              }
                              return incrementVersion('recipes', 'recipeID', recipe.recipeID, recipe.version).then((newVersion) =>
                                createRecipeLog(userID, authorization, 'updateRecipeVersion', Number(recipe.recipeID), Number(logID2), String(recipe.version), String(newVersion), `updated version of recipe: ${recipe.title} from ${recipe.version} to ${newVersion}`),
                              );
                            });
                        });
                        return Promise.all(stepPromises);
                      });
                  }
                }),
            );
          }
          return Promise.all(versionPromises);
        }),
      );
    }
  }
  Promise.all(logPromises).catch((error) => {
    global.logger.info(`Error creating log entries in updater: ${error.message}`);
    return { error: error.message };
  });
  return data[0];
};

const getRecipeVersion = async (recipeID) => {
  const { data: recipe, error: recipeError } = await supabase.from('recipes').select('version').single().match({ recipeID });
  if (recipeError || !recipe) {
    global.logger.info(`Error getting recipe version for recipeID:${recipeID} in db.js getRecipeVersion. **${recipeError.message}**`);
    return { error: recipeError.message };
  }
  return recipe.version;
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
    return data[0].version;
  }
};

module.exports = { supabase, supabaseDefault, updater, incrementVersion, getRecipeVersion, verifyUser };
