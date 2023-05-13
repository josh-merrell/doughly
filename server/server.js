// Import the express module
const express = require('express');

// Instantiate an express application
const app = express();

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
