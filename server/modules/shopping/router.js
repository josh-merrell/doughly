const express = require('express');

const { authenticateJWT } = require('../../middleware/auth');
const shoppingListsRouter = require('./lists/router');

const router = express.Router();

router.use('/lists', shoppingListsRouter);

router.use(authenticateJWT);

module.exports = router;
