('use strict');

module.exports = ({ db }) => {
  async function getTags(options) {
    const { userID, recipeTagIDs, recipeID, tagID } = options;
    let q = db.from('recipeTags').select().filter('userID', 'eq', userID).eq('deleted', false).order('recipeTagID', { ascending: true });
    if (recipeTagIDs) {
      q = q.in('recipeTagID', recipeTagIDs);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (tagID) {
      q = q.filter('tagID', 'eq', tagID);
    }
    const { data: recipeTags, error } = await q;

    if (error) {
      global.logger.info(`Error getting recipeTags: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${recipeTags.length} recipeTags`);
    return recipeTags;
  }

  async function getTagByID(options) {
    const { recipeTagID } = options;
    const { data: recipeTag, error } = await db.from('recipeTags').select().eq('recipeTagID', recipeTagID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting recipeTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got recipeTag`);
    return recipeTag;
  }

  async function create(options) {
    const { customID, userID, recipeID, tagID } = options;

    //verify that the provided recipeID exists, return error if not
    const { data: recipeCheck, error: recipeCheckError } = await db.from('recipes').select().eq('recipeID', recipeID).eq('hidden', false);
    if (recipeCheckError) {
      global.logger.info(`Error checking whether provided recipe exists: ${recipeCheckError.message}`);
      return { error: recipeCheckError.message };
    }
    if (!recipeCheck) {
      global.logger.info(`provided recipeID does not exist, can't create recipeTag`);
      return { error: `provided recipeID does not exist, can't create recipeTag` };
    }

    //verify that the provided tagID exists, return error if not
    const { data: tagCheck, error: tagCheckError } = await db.from('tags').select().eq('tagID', tagID);
    if (tagCheckError) {
      global.logger.info(`Error checking whether provided tag exists: ${tagCheckError.message}`);
      return { error: tagCheckError.message };
    }
    if (!tagCheck) {
      global.logger.info(`provided tagID does not exist, can't create recipeTag`);
      return { error: `provided tagID does not exist, can't create recipeTag` };
    }
    //verify that the provided recipeID and tagID combination doesn't already exist, return error if it does
    const { data: recipeTagCheck, error: recipeTagCheckError } = await db.from('recipeTags').select().eq('recipeID', recipeID).eq('tagID', tagID);
    if (recipeTagCheckError) {
      global.logger.info(`Error checking whether provided recipeTag exists: ${recipeTagCheckError.message}`);
      return { error: recipeTagCheckError.message };
    }
    if (recipeTagCheck.length > 0) {
      global.logger.info(`provided recipeTag already exists, can't create recipeTag`);
      return { error: `provided recipeTag already exists, can't create recipeTag` };
    }

    const { data: recipeTag, error } = await db.from('recipeTags').insert({ recipeTagID: customID, userID, recipeID, tagID }).select().single();

    if (error) {
      global.logger.info(`Error creating recipeTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created recipeTag`);
    return recipeTag;
  }

  async function deleteTag(options) {
    const { recipeTagID } = options;

    if (!recipeTagID) {
      global.logger.info(`recipeTagID is required`);
      return { error: `recipeTagID is required` };
    }

    const { data: recipeTag, error } = await db.from('recipeTags').update({ deleted: true }).eq('recipeTagID', recipeTagID);

    if (error) {
      global.logger.info(`Error deleting recipeTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted recipeTag`);
    return recipeTag;
  }

  return {
    get: {
      all: getTags,
      byID: getTagByID,
    },
    create,
    delete: deleteTag,
  };
};
