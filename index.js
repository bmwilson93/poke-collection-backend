const express = require('express');
const app = express();
require('dotenv').config();

// Router Imports
const sessionRouter = require('./routes/session.js');
const passportRouter = require('./routes/passport.js');

const PORT = process.env.PORT || 4001;

app.use(express.json());

// Routers
app.use(sessionRouter);
app.use(passportRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
})