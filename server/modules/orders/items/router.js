const express = require('express');

const orderTaskItemsRouter = require('./task/router');
const orderStockItemsRouter = require('./stock/router');

const router = express.Router();

router.use('/task', orderTaskItemsRouter);
router.use('/stock', orderStockItemsRouter);

module.exports = router;
