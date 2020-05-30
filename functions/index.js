'use strict';

const firebase = require('firebase');
const firebaseConfig = require('./config/firebaseConfig');
const functions = require('firebase-functions');
const express = require('express');
const app = express();
const login = express();

firebase.initializeApp(firebaseConfig);

const {
    firebaseAuth
} = require('./util/firebaseAuth');
const {
    newPost,
    getAllPosts
} = require('./handlers/posts');
const {
    newUser,
    getAllUsers
} = require('./handlers/users');
const {
    loginUser
} = require('./handlers/login');

app.get('/api/v1/posts', getAllPosts);
app.post('/api/v1/posts', firebaseAuth, newPost);

app.get('/api/v1/users', getAllUsers);
app.post('/api/v1/users', newUser);

login.post('/login', loginUser);

exports.api = functions.https.onRequest(app);
exports.login = functions.https.onRequest(login);