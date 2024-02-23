('use strict');

const { updater } = require('../../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, productStockIDs, stockProductID, producedDate, daysRemaining, status } = options;

    let q = db.from('productStocks').select().filter('userID', 'eq', userID).eq('deleted', false).order('productStockID', { ascending: true });

    if (productStockIDs) {
      q = q.in('productStockID', productStockIDs);
    }
    if (stockProductID) {
      q = q.filter('stockProductID', 'eq', stockProductID);
    }
    if (producedDate) {
      q = q.filter('producedDate', 'eq', producedDate);
    }
    if (daysRemaining) {
      q = q.filter('daysRemaining', 'eq', daysRemaining);
    }
    if (status) {
      q = q.filter('status', 'eq', status);
    }

    const { data: productStocks, error } = await q;

    if (error) {
      global.logger.info(`Error getting productStocks: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${productStocks.length} productStocks`);
    return productStocks;
  }

  async function getByID(options) {
    const { data, error } = await db.from('productStocks').select().eq('productStockID', options.productStockID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting productStock by ID: ${options.productStockID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { customID, userID, stockProductID, producedDate } = options;

    //validate that the provided stockProductID is valid
    const { data: stockProduct, error: stockProductError } = await db.from('stockProducts').select().eq('stockProductID', stockProductID);
    if (stockProductError) {
      global.logger.info(`Error validating stockProduct ID: ${stockProductID} while creating productStock ${stockProductError.message}`);
      return { error: stockProductError.message };
    }
    if (!stockProduct.length) {
      global.logger.info(`StockProduct with ID: ${stockProductID} does not exist. Cannot create productStock`);
      return { error: `StockProduct with ID: ${stockProductID} does not exist. Cannot create productStock` };
    }

    //calculate daysRemaining using stockProduct.recipeID to get recipe.lifespanDays
    const { data: recipe, error: recipeError } = await db.from('recipes').select().eq('recipeID', stockProduct[0].recipeID);
    if (recipeError) {
      global.logger.info(`Error validating recipe ID: ${stockProduct[0].recipeID} while creating productStock ${recipeError.message}`);
      return { error: recipeError.message };
    }
    if (!recipe.length) {
      global.logger.info(`Recipe with ID: ${stockProduct[0].recipeID} does not exist. Cannot create productStock`);
      return { error: `Recipe with ID: ${stockProduct[0].recipeID} does not exist. Cannot create productStock` };
    }

    //calculate daysRemaining from recipe.lifespanDays by comparing the producedDate to the current date, min is 0
    const producedDateObj = new Date(producedDate);
    const currentDateObj = new Date();
    const daysRemaining = Math.max(recipe[0].lifespanDays - Math.floor((currentDateObj - producedDateObj) / (1000 * 60 * 60 * 24)), 0);

    //create productStock (one for each of 'yield' in stockProduct.yield)
    const productStockPromises = [];
    const productStockIDs = [];

    for (let i = 0; i < stockProduct[0].yield; i++) {
      //take number of digits in stockProduct.yield and replace that number of digits from the end of customID with i padded with 0s
      const productStockID = customID.slice(0, -stockProduct[0].yield.toString().length) + i.toString().padStart(stockProduct[0].yield.toString().length, '0');
      productStockPromises.push(
        db
          .from('productStocks')
          .insert({ productStockID, userID, stockProductID, producedDate, daysRemaining, status: daysRemaining ? 'fresh' : 'expired' })
          .select('productStockID'),
      );
    }

    try {
      const results = await Promise.all(productStockPromises);

      results.forEach((result) => {
        if (result.error) {
          throw new Error(result.error);
        } else {
          productStockIDs.push(result.data[0].productStockID);
        }
      });

      global.logger.info(`Created ${productStockIDs.length} productStocks`);
      return productStockIDs;
    } catch (error) {
      global.logger.info(`Error creating productStock: ${error.message}`);
      return { error: error.message };
    }
  }

  async function update(options) {
    const { productStockID } = options;

    //validate that the provided productStockID is valid
    const { data: productStock, error: productStockError } = await db.from('productStocks').select().eq('productStockID', productStockID);
    if (productStockError) {
      global.logger.info(`Error validating productStock ID: ${productStockID} while updating productStock ${productStockError.message}`);
      return { error: productStockError.message };
    }
    if (!productStock.length) {
      global.logger.info(`ProductStock with ID: ${productStockID} does not exist. Cannot update productStock`);
      return { error: `ProductStock with ID: ${productStockID} does not exist. Cannot update productStock` };
    }

    //update productStock
    const updateFields = {};

    for (let key in options) {
      if (key !== 'productStockID' && options[key] !== undefined) {
        updateFields[key] = options[key];
      }
    }

    try {
      const updatedStockProduct = await updater('productStockID', productStockID, 'productStocks', updateFields);
      global.logger.info(`Updated productStock with ID: ${productStockID}`);
      return updatedStockProduct;
    } catch (error) {
      global.logger.info(`Error updating productStock: ${error.message}`);
      return { error: error.message };
    }
  }

  async function deleteProductStock(options) {
    const { productStockID, reason } = options;

    //validate that the provided productStockID is valid
    const { data: productStock, error: productStockError } = await db.from('productStocks').select().eq('productStockID', productStockID).eq('deleted', false);
    if (productStockError) {
      global.logger.info(`Error validating productStock ID: ${productStockID} while deleting productStock ${productStockError.message}`);
      return { error: productStockError.message };
    }
    if (!productStock.length) {
      global.logger.info(`ProductStock with ID: ${productStockID} does not exist. Cannot delete productStock`);
      return { error: `ProductStock with ID: ${productStockID} does not exist. Cannot delete productStock` };
    }

    //delete productStock
    const { error: deletedProductStockError } = await db.from('productStocks').update({ deleted: true, reason }).eq('productStockID', productStockID);
    if (deletedProductStockError) {
      global.logger.info(`Error deleting productStock: ${deletedProductStockError.message}`);
      return { error: deletedProductStockError.message };
    }
    global.logger.info(`Deleted productStock with ID: ${productStockID}, reason: ${reason}`);
    return { success: true };
  }

  return {
    get: {
      all: getAll,
      byID: getByID,
    },
    create,
    update,
    delete: deleteProductStock,
  };
};
