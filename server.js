const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

//DB Config
const db = require('./config/keys').mongoURI;

//Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => console.log('mongoDB connected'))
  .catch(err => console.log(err));

// app.get('/', (req, res) => res.send('hello'));

// Passport Middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport)

//Use Routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts)

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`server running on port ${port}`));
