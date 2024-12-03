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
    // query to add a row to users, and a row to collections
    const newUser = await db.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username, password;',
      [user.email, user.username, user.password]
    );
    newUser = newUser.rows[0];

    const newCollection = await db.query(
      'INSERT INTO collections (collection, user_id) VALUES ($1, $2) RETURNING collection;',
      ['{"sets":[]}', newUser.id]
    );
    newUser.collection = newCollection.rows[0].collection;

    return newUser;
    
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { findUser, addUser }