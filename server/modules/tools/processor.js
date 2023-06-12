('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, toolIDs, name } = options;
    let q = db.from('tools').select().filter('userID', 'eq', userID).order('toolID', { ascending: true });
    if (toolIDs) {
      q = q.in('toolID', toolIDs);
    }
    if (name) {
      q = q.like('name', name);
    }
    const { data: tools, error } = await q;

    if (error) {
      global.logger.info(`Error getting tools: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${tools.length} tools`);
    return tools;
  }

  async function getByID(options) {
    const { toolID } = options;
    const { data: tool, error } = await db.from('tools').select().eq('toolID', toolID);

    if (error) {
      global.logger.info(`Error getting tool: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got tool`);
    return tool;
  }

  async function create(options) {
    const { userID, name } = options;

    //validate that the provided name is not already used by another tool
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('name', name);
    if (existingToolError) {
      global.logger.info(`Error getting existing tools: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (existingTool.length > 0) {
      global.logger.info(`Tool with name ${name} already exists`);
      return { error: `Tool with name ${name} already exists` };
    }

    //create the tool
    const { data: tool, error } = await db.from('tools').insert({ userID, name }).select('toolID').single();

    if (error) {
      global.logger.info(`Error creating tool: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created tool ID ${tool.toolID}`);
    return tool;
  }

  async function update(options) {
    const { toolID, name } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
    if (existingToolError) {
      global.logger.info(`Error checking for existing tool: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (existingTool.length === 0) {
      global.logger.info(`Tool with ID ${toolID} does not exist, cannot update tool`);
      return { error: `Tool with ID ${toolID} does not exist, cannot update tool` };
    }

    //validate that the provided name is not already used by another tool
    const { data: existingTool2, error: existingToolError2 } = await db.from('tools').select().eq('name', name);
    if (existingToolError2) {
      global.logger.info(`Error checking for duplicated tool name: ${existingToolError2.message}`);
      return { error: existingToolError2.message };
    }
    if (existingTool2.length) {
      global.logger.info(`Tool with name ${name} already exists`);
      return { error: `Tool with name ${name} already exists` };
    }

    //update the tool
    const updateFields = {};
    for (let key in options) {
      if (key !== 'toolID') {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedTool = await updater('toolID', toolID, 'tools', updateFields);
      global.logger.info(`Updated tool ID ${toolID}`);
      return updatedTool;
    } catch (error) {
      global.logger.info(`Error updating tool: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteTool(options) {
    const { toolID } = options;

    //validate that the provided toolID exists
    const { data: existingTool, error: existingToolError } = await db.from('tools').select().eq('toolID', toolID);
    if (existingToolError) {
      global.logger.info(`Error checking for existing tool: ${existingToolError.message}`);
      return { error: existingToolError.message };
    }
    if (!existingTool.length) {
      global.logger.info(`Tool with ID ${toolID} does not exist, cannot delete tool`);
      return { error: `Tool with ID ${toolID} does not exist, cannot delete tool` };
    }

    //delete the tool
    const { error } = await db.from('tools').delete().eq('toolID', toolID);

    if (error) {
      global.logger.info(`Error deleting tool: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Deleted tool ID ${toolID}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteTool,
  };
};
