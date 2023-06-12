('use strict');

module.exports = ({ db }) => {
  async function getTags(options) {
    const { userID, tagIDs, name } = options;
    let q = db.from('tags').select().filter('userID', 'eq', userID).order('tagID', { ascending: true });
    if (tagIDs) {
      q = q.in('tagID', tagIDs);
    }
    if (name) {
      q = q.like('name', name);
    }
    const { data: tags, error } = await q;

    if (error) {
      global.logger.info(`Error getting tags: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${tags.length} tags`);
    return tags;
  }

  async function getTagByID(options) {
    const { tagID } = options;
    const { data: tag, error } = await db.from('tags').select().eq('tagID', tagID);

    if (error) {
      global.logger.info(`Error getting tag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got tag`);
    return tag;
  }

  async function create(options) {
    const { name } = options;

    if (!name) {
      global.logger.info(`Name is required`);
      return { error: `Name is required` };
    }

    const { data: tag, error } = await db.from('tags').insert({ name }).select().single();

    if (error) {
      global.logger.info(`Error creating tag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created tag`);
    return tag;
  }

  async function update(options) {
    const { tagID, name } = options;

    if (!tagID) {
      global.logger.info(`tagID is required`);
      return { error: `tagID is required` };
    }

    //if name is null, return an error
    if (!name) {
      global.logger.info(`Name is required`);
      return { error: `Name is required` };
    }

    //verify that the provided tagID exists, return error if not
    const { data: tagCheck, error: tagCheckError } = await db.from('tags').select().eq('tagID', tagID);
    if (tagCheckError) {
      global.logger.info(`Error checking whether provided tag exists: ${tagCheckError.message}`);
      return { error: tagCheckError.message };
    }
    if (!tagCheck) {
      global.logger.info(`tagID does not exist`);
      return { error: `tagID does not exist` };
    }

    const { data: tag, error } = await db.from('tags').update({ name }).eq('tagID', tagID);

    if (error) {
      global.logger.info(`Error updating tag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Updated tag`);
    return tag;
  }

  async function deleteTag(options) {
    const { tagID } = options;

    if (!tagID) {
      global.logger.info(`tagID is required`);
      return { error: `tagID is required` };
    }

    //verify that the provided tagID exists, return error if not
    const { data: tagCheck, error: tagCheckError } = await db.from('tags').select().eq('tagID', tagID);
    if (tagCheckError) {
      global.logger.info(`Error checking whether provided tag exists: ${tagCheckError.message}`);
      return { error: tagCheckError.message };
    }
    if (!tagCheck) {
      global.logger.info(`tagID does not exist`);
      return { error: `tagID does not exist` };
    }

    const { data: tag, error } = await db.from('tags').delete().eq('tagID', tagID);

    if (error) {
      global.logger.info(`Error deleting tag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted tag`);
    return tag;
  }

  return {
    get: {
      all: getTags,
      byID: getTagByID,
    },
    create,
    update,
    delete: deleteTag,
  };
};
