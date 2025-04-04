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
const { findUser, addUser, updateUserEmail, updateUserPassword } = require('../database/users.js');

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
  // console.log("deseializing User")
  // console.log(id);
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
  // console.log("local strategy")
  // console.log(`username: ${username}, password: ${password}`)
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
        console.log("Wrong password")
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



// Helper functions
const sanitize = (req, res, next) => {
  // sanitize the properties in the request body
  let props = Object.keys(req?.body) || [];
  props.forEach(prop => {
    req.body[prop] = validator.trim(validator.escape(req.body[prop]));
  });
  next();
}

const isValidLength = (field, fmin, fmax) => {
  return (validator.isLength(field, {min: 6, max: 24}));
}

const isValidEmail = (email) => {
  return (validator.isEmail(email) && validator.isLength(email, {min: 3, max: 128}));
}

const isValidPassword = (password) => {
  const pwregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
  return (isValidLength(password, 6, 24) && pwregex.test(password));
}


// ROUTES
router.post('/api/login', 
  sanitize,
  (req, res, next) => {
    if (!isValidEmail(req?.body?.email)) return res.status(400).send("The provided email address is not a valid email address.");
    if (!isValidPassword(req?.body?.password)) return res.status(400).send("The provided password is not a valid password.");
    next();
  },
  passport.authenticate('local', { failureRedirect: '/api/login-failure' }),
  (req, res) => {
    return res.json(req.user)
  }
)

router.post('/api/login-failure', (req, res) => {
  return res.status(400).send("There was an issue with logging in. Either your email or password was incorrect.");
})

router.post('/api/register', 
  sanitize,
  (req, res, next) => {
    // Validate the provided email, username, and password before proceeding
    if (!isValidEmail(req?.body?.email)) {
      return res.status(400).json({error: "The provided email address is not a valid email address."})
    }
    if (!isValidLength(req?.body?.username, 3, 64)) {
      return res.status(400).json({error: "Your provided username is either too long, or too short."})
    }
    if (!isValidPassword(req?.body?.password)) {
      console.log("Password error")
      return res.status(400).json({error: "The provided password is not a valid password."})
    }
    next();
  },
  async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const user = await findUser(email);
    if (user) { // email already in use
      res.status(400).send("The provided email is already in use! Please try again.");
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

      console.log("User:")
      console.log(user);

      // call passport.js login function to login the new user
      req.login(user, (err) => {
        console.log("New user added");
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

router.post('/api/update-email', 
  sanitize,
  (req, res, next) => {
    // Validate the provided email, new email, and password before proceeding
    if (!isValidEmail(req?.body?.email)) return res.status(400).send("The provided email address is not a valid email address.");
    if (!isValidEmail(req?.body?.newEmail)) return res.status(400).send("Your provided username is either too long, or too short.");
    if (!isValidPassword(req?.body?.password)) return res.status(400).send("The provided password is not a valid password.");
    next();
  },
  async (req, res) => {
    try {
      const user = await findUser(req.body.email);
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) { // password correct
          // Update the user's email
          const updatedUser = await updateUserEmail(user, req.body.newEmail);
          if (updatedUser) {
            res.status(200).json(updatedUser);
          } else {
            res.status(400).send("There was an error with updating your email.")
          }

        } else { //  password wrong
          res.status(400).send("Couldn't update email. The password entered was incorrect.");
        }
      } else {
        res.status(400).send("No user was found with the provided email.")
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("There was a server error with updating your email.");
    }
  }
)

router.post('/api/change-password', 
  sanitize,
  (req, res, next) => {
  if (!isValidPassword(req?.body?.password)) return res.status(400).send("Your password is either too short or too long.");
  if (!isValidPassword(req?.body?.newPassword)) return res.status(400).send("Your new password is either too short or too long.");
  next();
  },
  async (req, res) => {
    try {
      const user = await findUser(req.body.email);
      if (user) {

        if (bcrypt.compareSync(req.body.password, user.password)) { // password correct

          // hash the new password and then updated the users current password
          const salt = bcrypt.genSaltSync(saltRounds);
          const hash = bcrypt.hashSync(req.body.newPassword, salt);

          const updatedUser = await updateUserPassword(user, hash);
          if (updatedUser) {
            res.status(200).json(updatedUser);
          } else {
            res.status(400).send("There was an error with updating your password.")
          }


        } else { //  password wrong
          res.status(400).send("Couldn't update password. The current password entered was incorrect.");
        }
      } else {
        res.status(400).send("No user was found with the provided email.")
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("There was a server error with updating your password.");
    }
  }
)

router.get('/api/isloggedin', (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(204).send();
  }
})

module.exports = router;