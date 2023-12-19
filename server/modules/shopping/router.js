const express = require('express');

const { authenticateJWT } = require('../../middleware/auth');
const shoppingListsRouter = require('./lists/router');
const shoppingListRecipesRouter = require('./listRecipes/router');
const shoppingListIngredientsRouter = require('./listIngredients/router');

const router = express.Router();

router.use('/lists', shoppingListsRouter);
router.use('/listRecipes', shoppingListRecipesRouter);
router.use('/listIngredients', shoppingListIngredientsRouter);

module.exports = router;
