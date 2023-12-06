# Diff Details

Date : 2023-12-03 13:56:00

Directory c:\\Users\\Josh\\repos\\doughleap\\server\\modules

Total : 109 files,  7508 codes, 719 comments, 1218 blanks, all 9445 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [server/middleware/ID.js](/server/middleware/ID.js) | JavaScript | -55 | -12 | -11 | -78 |
| [server/middleware/auth.js](/server/middleware/auth.js) | JavaScript | -29 | -2 | -5 | -36 |
| [server/middleware/errorHandling.js](/server/middleware/errorHandling.js) | JavaScript | -83 | -9 | -13 | -105 |
| [server/middleware/multer.js](/server/middleware/multer.js) | JavaScript | 0 | 0 | -1 | -1 |
| [server/middleware/queryParsing.js](/server/middleware/queryParsing.js) | JavaScript | -13 | -2 | -4 | -19 |
| [server/middleware/test_ID.js](/server/middleware/test_ID.js) | JavaScript | -28 | -2 | -7 | -37 |
| [server/middleware/validating.js](/server/middleware/validating.js) | JavaScript | -18 | 0 | -3 | -21 |
| [server/modules/UNUSED/clients/handler.js](/server/modules/UNUSED/clients/handler.js) | JavaScript | 87 | 0 | 7 | 94 |
| [server/modules/UNUSED/clients/processor.js](/server/modules/UNUSED/clients/processor.js) | JavaScript | 172 | 10 | 23 | 205 |
| [server/modules/UNUSED/clients/router.js](/server/modules/UNUSED/clients/router.js) | JavaScript | 15 | 0 | 6 | 21 |
| [server/modules/UNUSED/employees/handler.js](/server/modules/UNUSED/employees/handler.js) | JavaScript | 101 | 0 | 7 | 108 |
| [server/modules/UNUSED/employees/processor.js](/server/modules/UNUSED/employees/processor.js) | JavaScript | 251 | 19 | 36 | 306 |
| [server/modules/UNUSED/employees/router.js](/server/modules/UNUSED/employees/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/UNUSED/invoices/handler.js](/server/modules/UNUSED/invoices/handler.js) | JavaScript | 50 | 0 | 5 | 55 |
| [server/modules/UNUSED/invoices/logs/handler.js](/server/modules/UNUSED/invoices/logs/handler.js) | JavaScript | 36 | 0 | 4 | 40 |
| [server/modules/UNUSED/invoices/logs/processor.js](/server/modules/UNUSED/invoices/logs/processor.js) | JavaScript | 42 | 1 | 9 | 52 |
| [server/modules/UNUSED/invoices/logs/router.js](/server/modules/UNUSED/invoices/logs/router.js) | JavaScript | 13 | 0 | 6 | 19 |
| [server/modules/UNUSED/invoices/notes/handler.js](/server/modules/UNUSED/invoices/notes/handler.js) | JavaScript | 33 | 0 | 4 | 37 |
| [server/modules/UNUSED/invoices/notes/processor.js](/server/modules/UNUSED/invoices/notes/processor.js) | JavaScript | 41 | 2 | 11 | 54 |
| [server/modules/UNUSED/invoices/notes/router.js](/server/modules/UNUSED/invoices/notes/router.js) | JavaScript | 13 | 0 | 6 | 19 |
| [server/modules/UNUSED/invoices/processor.js](/server/modules/UNUSED/invoices/processor.js) | JavaScript | 103 | 3 | 18 | 124 |
| [server/modules/UNUSED/invoices/router.js](/server/modules/UNUSED/invoices/router.js) | JavaScript | 18 | 0 | 6 | 24 |
| [server/modules/UNUSED/orders/handler.js](/server/modules/UNUSED/orders/handler.js) | JavaScript | 78 | 0 | 7 | 85 |
| [server/modules/UNUSED/orders/items/router.js](/server/modules/UNUSED/orders/items/router.js) | JavaScript | 7 | 0 | 5 | 12 |
| [server/modules/UNUSED/orders/items/stock/handler.js](/server/modules/UNUSED/orders/items/stock/handler.js) | JavaScript | 60 | 0 | 7 | 67 |
| [server/modules/UNUSED/orders/items/stock/processor.js](/server/modules/UNUSED/orders/items/stock/processor.js) | JavaScript | 152 | 13 | 28 | 193 |
| [server/modules/UNUSED/orders/items/stock/router.js](/server/modules/UNUSED/orders/items/stock/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/UNUSED/orders/items/task/handler.js](/server/modules/UNUSED/orders/items/task/handler.js) | JavaScript | 61 | 0 | 7 | 68 |
| [server/modules/UNUSED/orders/items/task/processor.js](/server/modules/UNUSED/orders/items/task/processor.js) | JavaScript | 130 | 9 | 24 | 163 |
| [server/modules/UNUSED/orders/items/task/router.js](/server/modules/UNUSED/orders/items/task/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/UNUSED/orders/processor.js](/server/modules/UNUSED/orders/processor.js) | JavaScript | 172 | 14 | 31 | 217 |
| [server/modules/UNUSED/orders/router.js](/server/modules/UNUSED/orders/router.js) | JavaScript | 18 | 0 | 8 | 26 |
| [server/modules/UNUSED/payments/handler.js](/server/modules/UNUSED/payments/handler.js) | JavaScript | 36 | 0 | 4 | 40 |
| [server/modules/UNUSED/payments/processor.js](/server/modules/UNUSED/payments/processor.js) | JavaScript | 88 | 5 | 22 | 115 |
| [server/modules/UNUSED/payments/router.js](/server/modules/UNUSED/payments/router.js) | JavaScript | 13 | 0 | 6 | 19 |
| [server/modules/UNUSED/productStocks/handler.js](/server/modules/UNUSED/productStocks/handler.js) | JavaScript | 61 | 0 | 7 | 68 |
| [server/modules/UNUSED/productStocks/processor.js](/server/modules/UNUSED/productStocks/processor.js) | JavaScript | 142 | 9 | 26 | 177 |
| [server/modules/UNUSED/productStocks/router.js](/server/modules/UNUSED/productStocks/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/UNUSED/stockProducts/handler.js](/server/modules/UNUSED/stockProducts/handler.js) | JavaScript | 59 | 0 | 7 | 66 |
| [server/modules/UNUSED/stockProducts/processor.js](/server/modules/UNUSED/stockProducts/processor.js) | JavaScript | 119 | 7 | 27 | 153 |
| [server/modules/UNUSED/stockProducts/router.js](/server/modules/UNUSED/stockProducts/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/UNUSED/tags/handler.js](/server/modules/UNUSED/tags/handler.js) | JavaScript | 56 | 0 | 7 | 63 |
| [server/modules/UNUSED/tags/order/handler.js](/server/modules/UNUSED/tags/order/handler.js) | JavaScript | 44 | 0 | 6 | 50 |
| [server/modules/UNUSED/tags/order/processor.js](/server/modules/UNUSED/tags/order/processor.js) | JavaScript | 92 | 3 | 16 | 111 |
| [server/modules/UNUSED/tags/order/router.js](/server/modules/UNUSED/tags/order/router.js) | JavaScript | 15 | 0 | 6 | 21 |
| [server/modules/UNUSED/tags/processor.js](/server/modules/UNUSED/tags/processor.js) | JavaScript | 103 | 3 | 21 | 127 |
| [server/modules/UNUSED/tags/recipe/handler.js](/server/modules/UNUSED/tags/recipe/handler.js) | JavaScript | 44 | 0 | 6 | 50 |
| [server/modules/UNUSED/tags/recipe/processor.js](/server/modules/UNUSED/tags/recipe/processor.js) | JavaScript | 92 | 3 | 15 | 110 |
| [server/modules/UNUSED/tags/recipe/router.js](/server/modules/UNUSED/tags/recipe/router.js) | JavaScript | 15 | 0 | 6 | 21 |
| [server/modules/UNUSED/tags/router.js](/server/modules/UNUSED/tags/router.js) | JavaScript | 20 | 0 | 7 | 27 |
| [server/modules/ingredientStocks/handler.js](/server/modules/ingredientStocks/handler.js) | JavaScript | 60 | 0 | 6 | 66 |
| [server/modules/ingredientStocks/processor.js](/server/modules/ingredientStocks/processor.js) | JavaScript | 134 | 13 | 25 | 172 |
| [server/modules/ingredientStocks/router.js](/server/modules/ingredientStocks/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/ingredients/handler.js](/server/modules/ingredients/handler.js) | JavaScript | 65 | 0 | 6 | 71 |
| [server/modules/ingredients/processor.js](/server/modules/ingredients/processor.js) | JavaScript | 193 | 20 | 33 | 246 |
| [server/modules/ingredients/recipe/handler.js](/server/modules/ingredients/recipe/handler.js) | JavaScript | 69 | 0 | 6 | 75 |
| [server/modules/ingredients/recipe/processor.js](/server/modules/ingredients/recipe/processor.js) | JavaScript | 174 | 21 | 34 | 229 |
| [server/modules/ingredients/recipe/router.js](/server/modules/ingredients/recipe/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/ingredients/router.js](/server/modules/ingredients/router.js) | JavaScript | 18 | 0 | 7 | 25 |
| [server/modules/logs/handler.js](/server/modules/logs/handler.js) | JavaScript | 0 | 35 | 5 | 40 |
| [server/modules/logs/kitchen/handler.js](/server/modules/logs/kitchen/handler.js) | JavaScript | 37 | 0 | 5 | 42 |
| [server/modules/logs/kitchen/processor.js](/server/modules/logs/kitchen/processor.js) | JavaScript | 58 | 0 | 8 | 66 |
| [server/modules/logs/processor.js](/server/modules/logs/processor.js) | JavaScript | 0 | 62 | 9 | 71 |
| [server/modules/logs/recipeFeedback/handler.js](/server/modules/logs/recipeFeedback/handler.js) | JavaScript | 35 | 0 | 5 | 40 |
| [server/modules/logs/recipeFeedback/processor.js](/server/modules/logs/recipeFeedback/processor.js) | JavaScript | 64 | 0 | 9 | 73 |
| [server/modules/logs/recipe/handler.js](/server/modules/logs/recipe/handler.js) | JavaScript | 37 | 0 | 5 | 42 |
| [server/modules/logs/recipe/processor.js](/server/modules/logs/recipe/processor.js) | JavaScript | 58 | 0 | 9 | 67 |
| [server/modules/logs/router.js](/server/modules/logs/router.js) | JavaScript | 25 | 0 | 9 | 34 |
| [server/modules/logs/user/handler.js](/server/modules/logs/user/handler.js) | JavaScript | 37 | 0 | 5 | 42 |
| [server/modules/logs/user/processor.js](/server/modules/logs/user/processor.js) | JavaScript | 58 | 0 | 9 | 67 |
| [server/modules/persons/followships/handler.js](/server/modules/persons/followships/handler.js) | JavaScript | 74 | 0 | 7 | 81 |
| [server/modules/persons/followships/processor.js](/server/modules/persons/followships/processor.js) | JavaScript | 134 | 8 | 22 | 164 |
| [server/modules/persons/followships/router.js](/server/modules/persons/followships/router.js) | JavaScript | 16 | 0 | 4 | 20 |
| [server/modules/persons/friendships/handler.js](/server/modules/persons/friendships/handler.js) | JavaScript | 79 | 0 | 7 | 86 |
| [server/modules/persons/friendships/processor.js](/server/modules/persons/friendships/processor.js) | JavaScript | 252 | 25 | 31 | 308 |
| [server/modules/persons/friendships/router.js](/server/modules/persons/friendships/router.js) | JavaScript | 16 | 0 | 4 | 20 |
| [server/modules/persons/handler.js](/server/modules/persons/handler.js) | JavaScript | 89 | 0 | 7 | 96 |
| [server/modules/persons/processor.js](/server/modules/persons/processor.js) | JavaScript | 147 | 15 | 26 | 188 |
| [server/modules/persons/router.js](/server/modules/persons/router.js) | JavaScript | 20 | 0 | 8 | 28 |
| [server/modules/profiles/handler.js](/server/modules/profiles/handler.js) | JavaScript | 88 | 0 | 9 | 97 |
| [server/modules/profiles/processor.js](/server/modules/profiles/processor.js) | JavaScript | 210 | 18 | 33 | 261 |
| [server/modules/profiles/router.js](/server/modules/profiles/router.js) | JavaScript | 17 | 0 | 6 | 23 |
| [server/modules/recipes/categories/handler.js](/server/modules/recipes/categories/handler.js) | JavaScript | 12 | 45 | 6 | 63 |
| [server/modules/recipes/categories/processor.js](/server/modules/recipes/categories/processor.js) | JavaScript | 21 | 129 | 24 | 174 |
| [server/modules/recipes/categories/router.js](/server/modules/recipes/categories/router.js) | JavaScript | 11 | 5 | 6 | 22 |
| [server/modules/recipes/components/handler.js](/server/modules/recipes/components/handler.js) | JavaScript | 64 | 0 | 7 | 71 |
| [server/modules/recipes/components/processor.js](/server/modules/recipes/components/processor.js) | JavaScript | 113 | 10 | 25 | 148 |
| [server/modules/recipes/components/router.js](/server/modules/recipes/components/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/recipes/handler.js](/server/modules/recipes/handler.js) | JavaScript | 180 | 0 | 15 | 195 |
| [server/modules/recipes/processor.js](/server/modules/recipes/processor.js) | JavaScript | 787 | 56 | 77 | 920 |
| [server/modules/recipes/router.js](/server/modules/recipes/router.js) | JavaScript | 40 | 0 | 8 | 48 |
| [server/modules/steps/handler.js](/server/modules/steps/handler.js) | JavaScript | 59 | 0 | 6 | 65 |
| [server/modules/steps/processor.js](/server/modules/steps/processor.js) | JavaScript | 148 | 7 | 20 | 175 |
| [server/modules/steps/recipe/handler.js](/server/modules/steps/recipe/handler.js) | JavaScript | 61 | 0 | 6 | 67 |
| [server/modules/steps/recipe/processor.js](/server/modules/steps/recipe/processor.js) | JavaScript | 251 | 60 | 36 | 347 |
| [server/modules/steps/recipe/router.js](/server/modules/steps/recipe/router.js) | JavaScript | 16 | 0 | 7 | 23 |
| [server/modules/steps/router.js](/server/modules/steps/router.js) | JavaScript | 18 | 0 | 8 | 26 |
| [server/modules/toolStocks/handler.js](/server/modules/toolStocks/handler.js) | JavaScript | 65 | 49 | 11 | 125 |
| [server/modules/toolStocks/processor.js](/server/modules/toolStocks/processor.js) | JavaScript | 119 | 8 | 22 | 149 |
| [server/modules/toolStocks/router.js](/server/modules/toolStocks/router.js) | JavaScript | 16 | 0 | 7 | 23 |
| [server/modules/tools/handler.js](/server/modules/tools/handler.js) | JavaScript | 64 | 0 | 7 | 71 |
| [server/modules/tools/processor.js](/server/modules/tools/processor.js) | JavaScript | 169 | 15 | 28 | 212 |
| [server/modules/tools/recipe/handler.js](/server/modules/tools/recipe/handler.js) | JavaScript | 64 | 0 | 7 | 71 |
| [server/modules/tools/recipe/processor.js](/server/modules/tools/recipe/processor.js) | JavaScript | 259 | 40 | 32 | 331 |
| [server/modules/tools/recipe/router.js](/server/modules/tools/recipe/router.js) | JavaScript | 16 | 0 | 6 | 22 |
| [server/modules/tools/router.js](/server/modules/tools/router.js) | JavaScript | 18 | 0 | 7 | 25 |
| [server/modules/uploads/handler.js](/server/modules/uploads/handler.js) | JavaScript | 29 | 0 | 4 | 33 |
| [server/modules/uploads/processor.js](/server/modules/uploads/processor.js) | JavaScript | 78 | 4 | 15 | 97 |
| [server/modules/uploads/router.js](/server/modules/uploads/router.js) | JavaScript | 12 | 0 | 4 | 16 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details