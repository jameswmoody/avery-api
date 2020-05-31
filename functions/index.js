'use strict';

const firebase = require('firebase');
const firebaseConfig = require('./config/firebaseConfig');
const functions = require('firebase-functions');
const express = require('express');
const app = express();
const login = express();

firebase.initializeApp(firebaseConfig);

const { firebaseAuth } = require('./util/firebaseAuth');
const { newPost, getAllPosts } = require('./handlers/posts');
const { newUser, getUser, getAllUsers } = require('./handlers/users');
const { loginUser } = require('./handlers/login');

// Posts
app.get('/api/v1/posts', getAllPosts);
app.post('/api/v1/posts', firebaseAuth, newPost);

// Users
app.get('/api/v1/users', getAllUsers);
app.get('/api/v1/users/:userID', getUser);
app.post('/api/v1/users', newUser);

// Login
login.post('/login', loginUser);

exports.api = functions.https.onRequest(app);
exports.login = functions.https.onRequest(login);
