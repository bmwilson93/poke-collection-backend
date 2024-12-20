const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN,
  'Access-Control-Allow-Credentials': true,
  methods: ['POST', 'PUT', 'GET', 'DELETE', 'OPTIONS', 'HEAD'],
  credentials: true
}));

app.set("trust proxy", 1);

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