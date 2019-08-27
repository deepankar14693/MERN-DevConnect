const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const keys = require('../../config/keys');

// Load user register validator
const validateRegisterInput = require('../../validation/register');

// Load user login validator
const validateLoginInput = require('../../validation/login');

// Load User Model
const User = require('../../models/User')

/**
 * @route GET api/users/test
 * @desc Tests users route
 * @access public
 */
router.get('/test', (req, res) => res.json({ msg: 'Users works' }));

/**
 * @route GET api/users/register
 * @desc Register User
 * @access public
 */
router.post('/register', (req, res) => {

  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors);
      }
      else {
        const avatar = gravatar.url(req.body.email, {
          s: '200', // Size
          r: 'pg', // Rating
          d: 'mm' // Default
        });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          avatar
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          })
        })

      }
    })
})

/**
 * @route GET api/users/login
 * @desc User Login / JWT Authentication
 * @access public
 */
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  // Find User by email
  User.findOne({ email })
    .then(user => {
      if (!user) {
        //Email not found
        errors.email = 'User not found';
        return res.status(404).json(errors);
      }
      // Comparing password after email is found
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            // Password matched
            const jwtPayload = { id: user.id, name: user.name, avatar: user.avatar }; // creating JWT payload

            // Sign JWT token
            jwt.sign(jwtPayload, keys.secretKey, { expiresIn: 3600 }, (err, token) => {
              res.json({
                success: true,
                token: 'bearer ' + token
              })
            });
          }
          else {
            errors.password = 'Incorrect Password';
            res.status(400).json(errors);
          }
        })
    })
})

/**
 * @route GET api/users/current
 * @desc Get current user details
 * @access private
 */

router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  // res.json({msg: 'success' })
  // res.json(req.user)
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email
  })
})

module.exports = router;
