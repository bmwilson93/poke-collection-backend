const express = require("express"),
      router = express.Router();
const db = require('../database/db.js');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

// Bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

// add database user functions here
const { findUser } = require('../database/users.js');

router.use(passport.initialize());
router.use(passport.session());
router.use(passport.authenticate('session'));

// Serialize and Deserialize Passport
// gets the user info and saves it to the session
passport.serializeUser(async (user, done) => {
  try {
    const result = await db.query(`SELECT id FROM users WHERE email='${user}';`);

    let userObject = result.rows[0]
    console.log(userObject);

    done(null, userObject);
  } catch (error) {
    return done(error);
  }
});

// gets the user by the id and saves it to the request object
passport.deserializeUser(async (id, done) => {
  try {
    // query the database using id to find the user
    if (id) {
      const result = await db.query(`SELECT email, username, collection FROM users JOIN collections ON users.id = collections.user_id WHERE id='${id}';`);
      // need to also get the collection from the database and add it to the user
      let user = result.rows[0];
      done(null, user);
    }
  } catch (error) {
    return done(error);
  }
});

// username == email
passport.use(new localStrategy(async (username, password, done) => {
  try {
    // if user not found, return done(null, false);
    const user = await findUser(username);
    // const emailExists = result.rows.length
    if (user) { // user found
      if (bcrypt.compareSync(password, user.password)) { // password correct
        return done(null, user.email);
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
  passport.authenticate('local', { failureRedirect: '/login' }),
  (req, res) => {
    res.json(req.session.passport.user)
  }
)

router.post('api/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const user = await findUser(username);
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

      await addUser(newUser);

      // call passport.js login function to login the new user
      req.login(newUser.email, (err) => {
        console.log("New user added");
        delete newUser.password;
        res.json(newUser);
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
    res.json(req.session.passport.user);
  } else {
    res.status(401).send(false);
  }
})

module.exports = router;