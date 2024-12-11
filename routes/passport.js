const express = require("express"),
      router = express.Router();
const db = require('../database/db.js');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const validator = require('validator');

// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// add database user functions here
const { findUser, addUser } = require('../database/users.js');

router.use(passport.initialize());
router.use(passport.session());
router.use(passport.authenticate('session'));

// Serialize and Deserialize Passport
// gets the user info and saves it to the session
passport.serializeUser(async (user, done) => {
  console.log('serializeing User')
  try {
    const result = await db.query(
      'SELECT id FROM users WHERE email=$1;',
      [user.email]
    );

    let userObject = result.rows[0]
    console.log(userObject);

    done(null, userObject);
  } catch (error) {
    return done(error);
  }
});

// gets the user by the id and saves it to the request object
passport.deserializeUser(async (id, done) => {
  console.log("deseializing User")
  console.log(id);
  try {
    // query the database using id to find the user
    if (id) {
      const result = await db.query(
        'SELECT email, username, collection FROM users JOIN collections ON users.id = collections.user_id WHERE users.id=$1;',
        [id.id]
      );
      let user = result.rows[0];
      console.log("User:")
      console.log(user)
      done(null, user);
    }
  } catch (error) {
    return done(error);
  }
});

// username == email
passport.use(new localStrategy({usernameField: 'email'}, async (username, password, done) => {
  console.log("local strategy")
  console.log(`username: ${username}, password: ${password}`)
  try {
    // if user not found, return done(null, false);
    const user = await findUser(username);
    console.log(`after looking for user: ${user}`);
    // const emailExists = result.rows.length
    if (user) { // user found
      if (bcrypt.compareSync(password, user.password)) { // password correct
        delete user.password;
        return done(null, user); // changed user.email to user
      } else { //  password wrong
        return done(null, false);
      }
    } else { // no user found
      return done(null, false);
    }
  } catch (error) {
    return done(error);
  }
}
));



// ROUTES
router.post('/api/login', 
  (req, res, next) => {
    console.log("Starting at login route, body:")
    console.log(req.body);

    console.log();

    // trim email and password
    validator.trim(req.body.email);
    validator.trim(req.body.password);

    // sanitize the email and password
    req.body.email = validator.escape(req.body.email);
    req.body.password = validator.escape(req.body.password);

    // check email and password with validator
    // if req.body.email is not email res with error
    if (!validator.isEmail(req.body.email)) {
      res.status(400).send();
    } else if (validator.isEmpty(req.body.password)) {
      res.status(400).send();
    } else {
      next();
    }
  },
  passport.authenticate('local', { failureRedirect: '/api/login' }),
  (req, res) => {
    console.log("Running after authenticate")
    console.log(req.user);
    res.json(req.user)
  }
)

router.post('/api/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const user = await findUser(email);
    if (user) { // email already in use
      console.log('User already exists');
      res.status(400).send("Email already used!");
    } else { // email not used, add new user
      console.log('Adding new user');

      const salt = bcrypt.genSaltSync(saltRounds);
      const hash = bcrypt.hashSync(password, salt);

      const newUser = {
        'email': email,
        'username' : username,
        'password' : hash,
      }

      const user = await addUser(newUser);

      // call passport.js login function to login the new user
      req.login(user, (err) => {
        console.log("New user added");
        // delete newUser.password;
        console.log(user);
        res.json(user);
      })
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error with adding new user");
  }
})

router.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {console.log(err)}
    res.status(200).send();
  });
})

router.get('/api/isloggedin', (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(204).send();
  }
})

module.exports = router;