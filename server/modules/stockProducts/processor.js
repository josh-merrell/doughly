('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, stockProductIDs, recipeID, productName } = options;

    let q = db.from('stockProducts').select().filter('userID', 'eq', userID).eq('deleted', false).order('stockProductID', { ascending: true });

    if (stockProductIDs) {
      q = q.in('stockProductID', stockProductIDs);
    }
    if (recipeID) {
      q = q.filter('recipeID', 'eq', recipeID);
    }
    if (productName) {
      q = q.like('productName', productName);
    }

    const { data: stockProducts, error } = await q;

    if (error) {
      global.logger.info(`Error getting stockProducts: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${stockProducts.length} stockProducts`);
    return stockProducts;
  }

  async function getByID(options) {
    const { data, error } = await db.from('stockProducts').select().eq('stockProductID', options.stockProductID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting stockProduct by ID: ${options.stockProductID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { customID, userID, recipeID, productName, recipeYield } = options;

    //validate that there are no other stockProducts with the same recipeID
    const { data: existingStockProducts, error: existingStockProductsError } = await db.from('stockProducts').select().eq('recipeID', recipeID);
    if (existingStockProductsError) {
      global.logger.info(`Error validating recipe ID: ${recipeID} while creating stockProduct ${existingStockProductsError.message}`);
      return { error: existingStockProductsError.message };
    }
    if (existingStockProducts.length) {
      global.logger.info(`StockProduct with recipeID: ${recipeID} already exists. Cannot create stockProduct`);
      return { error: `StockProduct with recipeID: ${recipeID} already exists. Cannot create stockProduct` };
    }

    //validate recipe, return error if it doesn't exist
    const { data: recipe, error } = await db.from('recipes').select().eq('recipeID', recipeID);
    if (error) {
      global.logger.info(`Error validating recipe ID: ${recipeID} while creating stockProduct ${error.message}`);
      return { error: error.message };
    }
    if (!recipe.length) {
      global.logger.info(`provided recipe ID: ${recipeID} does not exist. Cannot create stockProduct`);
      return { error: `provided recipe ID: ${recipeID} does not exist. Cannot create stockProduct` };
    }

    //validate that provided recipeYield is positive integer
    if (!recipeYield || recipeYield < 1) {
      global.logger.info(`provided recipeYield: ${recipeYield} is not a positive integer. Cannot create stockProduct`);
      return { error: `provided recipeYield: ${recipeYield} is not a positive integer. Cannot create stockProduct` };
    }

    const { data: stockProduct, error: stockProductError } = await db.from('stockProducts').insert({ stockProductID: customID, userID, recipeID, productName, yield: recipeYield }).select().single();

    if (stockProductError) {
      global.logger.info(`Error creating stockProduct: ${stockProductError.message}`);
      return { error: stockProductError.message };
    }

    global.logger.info(`Created stockProduct ${stockProduct.stockProductID}`);
    return stockProduct;
  }

  async function update(options) {
    const { stockProductID } = options;

    //validate that provided stockProductID exists
    const { data: stockProduct, error } = await db.from('stockProducts').select().eq('stockProductID', stockProductID);
    if (error) {
      global.logger.info(`Error validating stockProduct ID: ${stockProductID} while updating stockProduct ${error.message}`);
      return { error: error.message };
    }
    if (!stockProduct.length) {
      global.logger.info(`provided stockProduct ID: ${stockProductID} does not exist. Cannot update stockProduct`);
      return { error: `provided stockProduct ID: ${stockProductID} does not exist. Cannot update stockProduct` };
    }

    const updateFields = {};
    for (let key in options) {
      if (key !== 'stockProductID' && key !== 'recipeYield' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }
    updateFields.yield = options.recipeYield;

    try {
      const updatedStockProduct = await updater('stockProductID', stockProductID, 'stockProducts', updateFields);
      global.logger.info(`Updated stockProduct ${stockProductID}`);
      return updatedStockProduct;
    } catch (e) {
      global.logger.info(`Error updating stockProduct ${stockProductID}: ${e.message}`);
      return { error: e.message };
    }

    //TODO: rerender any productStocks or orderStockProducts that use this stockProduct
  }

  async function deleteStockProduct(options) {
    const { stockProductID } = options;

    //validate that provided stockProductID exists
    const { data: stockProduct, error: validateError } = await db.from('stockProducts').select().eq('stockProductID', stockProductID).eq('deleted', false);
    if (validateError) {
      global.logger.info(`Error validating stockProduct ID: ${stockProductID} while deleting stockProduct ${validateError.message}`);
      return { error: validateError.message };
    }
    if (!stockProduct.length) {
      global.logger.info(`provided stockProduct ID: ${stockProductID} does not exist. Cannot delete stockProduct`);
      return { validateError: `provided stockProduct ID: ${stockProductID} does not exist. Cannot delete stockProduct` };
    }

    //TODO: validate that there are no productStocks or orderStockProducts that use this stockProduct before deleting

    const { data, error } = await db.from('stockProducts').update({ deleted: true }).eq('stockProductID', stockProductID).single();

    if (error) {
      global.logger.info(`Error deleting stockProduct: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Deleted stockProduct ${stockProductID}`);
    return data;
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteStockProduct,
  };
};
