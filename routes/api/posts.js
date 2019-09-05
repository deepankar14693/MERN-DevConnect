const express = require('express');
const router = express.Router();
const passport = require('passport');

// Load Post model
const Post = require('../../models/Post');
// Load Profile model 
const Profile = require('../../models/Profile');

//Load Post validator
const validatePostInput = require('../../validation/post');

/**
 * @route GET api/posts/test
 * @desc Tests posts route
 * @access public
 */
router.get('/test', (req, res) => res.json({ msg: 'Posts works' }));

/**
 * @route GET api/posts
 * @desc get all posts
 * @access public
 */
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }))
})

/**
 * @route GET api/posts/:id
 * @desc get post by id
 * @access public
 */
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopostfound: 'No post found with this id' }))
})

/**
 * @route DELETE api/posts/:id
 * @desc delete post by id
 * @access private
 */
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ unauthorized: 'you are not authorized' });
          }
          post.remove().then(() => res.json({ success: true }))
        })
        .catch(err => res.status(404).json({ nopostfound: 'No post found with this id' }))
    })
})

/**
 * @route POST api/posts
 * @desc create new post route
 * @access private
 */
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  if (!isValid) return res.status(400).json(errors);

  const newPost = new Post({
    name: req.body.name,
    text: req.body.text,
    avatar: req.body.avatar,
    user: req.user.id
  });
  newPost.save().then(post => res.json(post));
})

/**
 * @route POST api/posts/like/:id
 * @desc like post
 * @access private
 */
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then(profile => {
    Post.findById(req.params.id)
      .then(post => {
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          res.status(400).json({ alreadyliked: 'Post is already liked by you' })
        }
        post.likes.unshift({ user: req.user.id });
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(400).json({ postnotfound: 'Post not found' }))
  })
})

/**
 * @route POST api/posts/unlike/:id
 * @desc unlike post
 * @access private
 */
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then(profile => {
    Post.findById(req.params.id)
      .then(post => {
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
          res.status(400).json({ notliked: 'You have not yet liked this post' })
        }
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);
        post.save().then(post => res.json(post))
      })
      .catch(err => res.status(400).json({ postnotfound: 'Post not found' }))
  })
})

/**
 * @route POST api/posts/comment/:id
 * @desc comment on post
 * @access private
 */
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  const { errors, isValid } = validatePostInput(req.body);

  if (!isValid) return res.status(400).json(errors);

  Post.findById(req.params.id)
    .then(post => {
      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar
      }
      post.comments.unshift(newComment);
      post.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({ postnotfound: 'Post not found' }))
})

/**
 * @route DELETE api/posts/comment/:id/:comment_id
 * @desc remove comment from post
 * @access private
 */
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
        return res.status(404).json({ commentnotexists: 'Comment does not exist' });
      }
      const removeIndex = post.comments.map(comment => comment._id.toString()).indexOf(req.params.comment_id);
      post.comments.splice(removeIndex, 1);

      post.save().then(post => res.json(post));
    })
    .catch(err => res.status(404).json({ postnotfound: 'Post not found' }))
})

module.exports = router;
