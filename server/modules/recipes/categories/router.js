const express = require('express');

const { routeValidator } = require('../../../middleware/validating');
const { errorCatcher } = require('../../../middleware/errorHandling');
const { authenticateJWT } = require('../../../middleware/auth');
const { generateID } = require('../../../middleware/ID');
const handler = require('./handler');
// const { getRecipeCategorySchema_params, newRecipeCategorySchema_body, RecipeCategoryUpdateSchema_body, RecipeCategoryUpdateSchema_params, RecipeCategoryDeleteSchema_params } = require('../../../schemas/recipe-types');

const router = express.Router();
const h = handler;

router.use(authenticateJWT);

// router.get('/:recipeCategoryID', routeValidator(getRecipeCategorySchema_params, 'params'), errorCatcher(h.getRecipeCategoryByID));
router.get('/', errorCatcher(h.getRecipeCategories));
// router.post('/', generateID, routeValidator(newRecipeCategorySchema_body, 'body'), errorCatcher(h.createRecipeCategory));
// router.patch('/:recipeCategoryID', routeValidator(RecipeCategoryUpdateSchema_body, 'body'), routeValidator(RecipeCategoryUpdateSchema_params, 'params'), errorCatcher(h.updateRecipeCategory));
// router.delete('/:recipeCategoryID', routeValidator(RecipeCategoryDeleteSchema_params, 'params'), errorCatcher(h.deleteRecipeCategory));

module.exports = router;
