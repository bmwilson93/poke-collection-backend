const express = require('express');
const app = express();
require('dotenv').config();

// Router Imports
const sessionRouter = require('./routes/session.js');

const PORT = process.env.PORT || 4001;

// Routers
app.use(sessionRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
})