'use strict';
const { generateID } = require('../../middleware/ID');

async function getToolStocks(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockIDs, toolID, purchasedBy } = req.query;
  const returner = await p.get.all({ userID: req.userID, toolStockIDs, toolID, purchasedBy });
  return res.json(returner);
}

async function getToolStockByID(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const returner = await p.get.byID({ userID: req.userID, toolStockID });
  return res.json(returner);
}

async function createToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolID, purchasedBy, purchaseDate, quantity } = req.body;
  const { authorization } = req.headers;

  //validate that provided quantity is positive integer
  if (quantity < 1 || !Number.isInteger(quantity)) {
    global.logger.info(`Quantity must be a positive integer, got ${quantity}`);
    return { error: `Quantity must be a positive integer, got ${quantity}` };
  }

  //generate custom ID and create toolStock for each of provided quantity
  const toolStockPromises = [];
  const returner = {
    toolStockIDs: [],
    successCount: 0,
    failedCount: 0,
    failedReasons: [],
  };

  for (let i = 0; i < quantity; i++) {
    const customID = await generateID(req, res, 'handlerCall');
    //create a toolStock promise and push it to toolStockPromises
    toolStockPromises.push(
      p.create({
        userID: req.userID,
        customID,
        authorization,
        toolID,
        purchasedBy,
        purchaseDate,
        quantity,
      }),
    );
  }
  //wait for all toolStockPromises to resolve. Upon each resolution, push the toolStockID to returner.toolStockIDs. If any promise rejects, return the others and the error
  await Promise.allSettled(toolStockPromises).then((results) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        returner.successCount++;
        returner.toolStockIDs.push(result.value.toolStockID);
      } else {
        returner.failedCount++;
        returner.failedReasons.push(result.reason);
      }
    });
  });
  return res.json(returner);
}

async function updateToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const { authorization } = req.headers;
  const { purchasedBy, purchaseDate, quantity } = req.body;
  const returner = await p.update({
    userID: req.userID,
    authorization,
    toolStockID,
    purchasedBy,
    purchaseDate,
    quantity,
  });
  return res.json(returner);
}

async function deleteToolStock(req, res) {
  const db = req.client.db;
  const p = require('./processor')({ db });
  const { toolStockID } = req.params;
  const { authorization } = req.headers;
  const returner = await p.delete({
    userID: req.userID,
    toolStockID,
    authorization,
  });
  return res.json(returner);
}

module.exports = {
  getToolStocks,
  getToolStockByID,
  createToolStock,
  updateToolStock,
  deleteToolStock,
};
