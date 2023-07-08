('use strict');

module.exports = ({ db }) => {
  async function getTags(options) {
    const { userID, orderTagIDs, orderID, tagID } = options;
    let q = db.from('orderTags').select().filter('userID', 'eq', userID).eq('deleted', false).order('orderTagID', { ascending: true });
    if (orderTagIDs) {
      q = q.in('orderTagID', orderTagIDs);
    }
    if (orderID) {
      q = q.filter('orderID', 'eq', orderID);
    }
    if (tagID) {
      q = q.filter('tagID', 'eq', tagID);
    }
    const { data: orderTags, error } = await q;

    if (error) {
      global.logger.info(`Error getting orderTags: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${orderTags.length} orderTags`);
    return orderTags;
  }

  async function getTagByID(options) {
    const { orderTagID } = options;
    const { data: orderTag, error } = await db.from('orderTags').select().eq('orderTagID', orderTagID).eq('deleted', false);

    if (error) {
      global.logger.info(`Error getting orderTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got orderTag`);
    return orderTag;
  }

  async function create(options) {
    const { userID, orderID, tagID } = options;

    //verify that the provided orderID exists, return error if not
    const { data: orderCheck, error: orderCheckError } = await db.from('orders').select().eq('orderID', orderID);
    if (orderCheckError) {
      global.logger.info(`Error checking whether provided order exists: ${orderCheckError.message}`);
      return { error: orderCheckError.message };
    }
    if (!orderCheck) {
      global.logger.info(`provided orderID does not exist, can't create orderTag`);
      return { error: `provided orderID does not exist, can't create orderTag` };
    }

    //verify that the provided tagID exists, return error if not
    const { data: tagCheck, error: tagCheckError } = await db.from('tags').select().eq('tagID', tagID);
    if (tagCheckError) {
      global.logger.info(`Error checking whether provided tag exists: ${tagCheckError.message}`);
      return { error: tagCheckError.message };
    }
    if (!tagCheck) {
      global.logger.info(`provided tagID does not exist, can't create orderTag`);
      return { error: `provided tagID does not exist, can't create orderTag` };
    }

    //verify that the provided orderID and tagID combination doesn't already exist, return error if it does
    const { data: orderTagCheck, error: orderTagCheckError } = await db.from('orderTags').select().eq('orderID', orderID).eq('tagID', tagID);
    if (orderTagCheckError) {
      global.logger.info(`Error checking whether provided orderTag exists: ${orderTagCheckError.message}`);
      return { error: orderTagCheckError.message };
    }
    if (orderTagCheck.length > 0) {
      global.logger.info(`provided orderID(${orderID}) and tagID(${tagID}) combination already exists, can't create orderTag with orderID: ${orderID} and tagID: ${tagID}`);
      return { error: `provided orderID(${orderID}) and tagIDtagID(${tagID}) combination already exists, can't create orderTag with orderID: ${orderID} and tagID: ${tagID}` };
    }

    const { data: orderTag, error } = await db.from('orderTags').insert({ userID, orderID, tagID }).select().single();

    if (error) {
      global.logger.info(`Error creating orderTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created orderTag`);
    return orderTag;
  }

  async function deleteTag(options) {
    const { orderTagID } = options;

    if (!orderTagID) {
      global.logger.info(`orderTagID is required`);
      return { error: `orderTagID is required` };
    }

    const { data: orderTag, error } = await db.from('orderTags').update({ deleted: true }).eq('orderTagID', orderTagID);

    if (error) {
      global.logger.info(`Error deleting orderTag: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted orderTag`);
    return orderTag;
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
