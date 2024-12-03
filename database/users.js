const db = require('./db');

const findUser = async (email) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE email=$1;', [email]);
    const foundUser = result.rows[0];
    return foundUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const addUser = async (user) => {
  try {
    
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { findUser, addUser }