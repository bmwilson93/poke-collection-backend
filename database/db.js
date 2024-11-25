require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  // ssl: true, // uncomment when using live DB
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD
});

pool.connect();

module.exports = pool;