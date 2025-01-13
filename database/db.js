require('dotenv').config();
const { Pool } = require('pg');

const pool = process.env.IS_PRODUCTION === 'true'
  ? new Pool({connectionString: process.env.DB_CONNECTION_STRING}) 
  : new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
  })

pool.connect();

module.exports = pool;