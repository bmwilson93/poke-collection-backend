const db = require('./db');

const findUser = async (email) => {
  try {
    // const result = await db.query('SELECT * FROM users WHERE email=$1;', [email]);
    const result = await db.query('SELECT email, username, password, collection FROM users JOIN collections ON users.id = collections.user_id WHERE users.email=$1;', [email]);
    const foundUser = result.rows[0];
    return foundUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// Takes a user object from the register route in passport, and queries the db to add the user and a new collection row
const addUser = async (user) => {
  try {
    // query to add a row to users, and a row to collections
    let newUser = await db.query(
      'INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username;',
      [user.email, user.username, user.password]
    );
    newUser = newUser.rows[0];

    const newCollection = await db.query(
      'INSERT INTO collections (collection, user_id) VALUES ($1, $2) RETURNING collection;',
      ['{"sets":[]}', newUser.id]
    );
    newUser.collection = newCollection.rows[0].collection;
    delete newUser.id;
    return newUser;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const updateUserEmail = async (user, newEmail) => {
try {
  // Update the user email
  let result = await db.query(
    'UPDATE users SET email = $1 WHERE email = $2;',
    [newEmail, user.email]
  );
  if (result.rowCount) {
    // Get the updated user and the collection to return
    let updatedUser = await db.query(
      'SELECT email, username, collection FROM users JOIN collections ON users.id = collections.user_id WHERE users.email=$1;',
      [newEmail]
    );
    updatedUser = updatedUser.rows[0];
    return updatedUser;
  } else {
    return null;
  }


} catch (error) {
  console.log(error);
  return null;
}
}

const updateUserPassword = async (user, newPassword) => {
  try {
    // Update the user password
    let result = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2;',
      [newPassword, user]
    );
    if (result.rowCount) {
      // Get the user object to return now that password was updated
      let updatedUser = await db.query(
        'SELECT email, username, collection FROM users JOIN collections ON users.id = collections.user_id WHERE users.email=$1;',
        [newEmail]
      );
      updatedUser = updatedUser.rows[0];
      return updatedUser;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { findUser, addUser, updateUserEmail, updateUserPassword }