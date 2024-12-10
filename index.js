const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['POST', 'PUT', 'GET', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: true
}));
require('dotenv').config();

// Router Imports
const sessionRouter = require('./routes/session.js');
const passportRouter = require('./routes/passport.js');
const collectionRouter = require('./routes/collection.js');

const PORT = process.env.PORT || 4001;

app.use(express.json());

// Routers
app.use(sessionRouter);
app.use(passportRouter);
app.use('/api/collection', collectionRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
})