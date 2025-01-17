const express = require('express');
      router = express.Router();
require('dotenv').config();

// Sessions
const session = require('express-session');
const db = require('../database/db.js');
const pgSession = require('connect-pg-simple')(session);

router.use(session({
  store: new pgSession({
    pool: db,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 90,
    sameSite: "none",
    secure: true,
    httpOnly: true,
  },
  resave: false,
  saveUninitialized: false,
}));

module.exports = router;