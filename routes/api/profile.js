const express = require('express');
const router = express.Router();
const passport = require('passport');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

// Load Profile validator
const validateProfileInput = require('../../validation/profile');
// Load experience validator
const validateExperienceInput = require('../../validation/experience');
// Load education validator
const validateEducationInput = require('../../validation/education');

/**
 * @route GET api/profile/test
 * @desc Tests profile route
 * @access public
 */
router.get('/test', (req, res) => res.json({ msg: 'Profile works' }));

/**
 * @route GET api/profile
 * @desc get current user profile
 * @access private
 */
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])   // populating user property in profile model with user name and avatar, as we have connected user and profile models                                                                       through user property in profile model
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors)
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

/**
 * @route GET api/profile/handle/:handle
 * @desc get profile by handle
 * @access public
 */
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.json(err))
})

/**
 * @route GET api/profile/users/:user_id
 * @desc get profile by user id
 * @access public
 */
router.get('/user/:user_id', (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json({ profile: 'There is no profile for this user' }))
})

/**
 * @route GET api/profile/all
 * @desc get all profiles
 * @access public
 */
router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({ profiles: 'There are no profiles' }))
})

/**
 * @route POST api/profile
 * @desc create or edit user profile
 * @access private
 */
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  // const errors = {};

  if (!isValid) return res.status(400).json(errors);

  const profileFields = {};
  profileFields.user = req.user.id;
  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company) profileFields.company = req.body.company;
  if (req.body.website) profileFields.website = req.body.website;
  if (req.body.location) profileFields.location = req.body.location;
  if (req.body.status) profileFields.status = req.body.status;
  if (req.body.bio) profileFields.bio = req.body.bio;
  if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;

  if (typeof req.body.skills !== undefined) {
    profileFields.skills = req.body.skills.split(',')
  }

  profileFields.social = {};

  if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        //update profile
        Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
          .then(profile => res.json(profile))
      }
      else {
        //create profile

        // check if handle exists
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if (profile) {
              errors.handle = 'That handle already exists';
              res.json(errors);
            }
            else {
              new Profile(profileFields).save().then(profile => res.json(profile))
            }
          })

      }
    })

});

/**
 * @route POST api/profile/experience
 * @desc add experience to profile
 * @access private
 */
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);

  if (!isValid) return res.status(400).json(errors);

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }
      profile.experience.unshift(newExp);
      profile.save().then(profile => res.json(profile));
    })
})

/**
 * @route POST api/profile/education
 * @desc add education to profile
 * @access private
 */
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);

  if (!isValid) return res.status(400).json(errors);

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }
      profile.education.unshift(newEdu);
      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.json(err))
})

/**
 * @route DELETE api/profile/experience/:exp_id
 * @desc delete experience from profile using experience id
 * @access private
 */
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.experience
        .map(experience => experience.id)
        .indexOf(req.params.exp_id);

      profile.experience.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err))
})

/**
 * @route DELETE api/profile/experience/:exp_id
 * @desc delete experience from profile using experience id
 * @access private
 */
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const removeIndex = profile.education
        .map(education => education.id)
        .indexOf(req.params.edu_id);

      profile.education.splice(removeIndex, 1);

      profile.save().then(profile => res.json(profile));
    })
    .catch(err => res.status(404).json(err))
})

/**
 * @route DELETE api/profile
 * @desc delete user and profile
 * @access private
 */
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id })
    .then(() => {
      User.findOneAndRemove({ _id: req.user.id })
        .then(() => res.json({ success: true }))
    })
})

module.exports = router;
