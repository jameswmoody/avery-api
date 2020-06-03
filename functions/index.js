const functions = require('firebase-functions');
const app = require('express')();
const login = require('express')();
const firebaseAuth = require('./util/firebaseAuth');

const {
	newPost,
	getPost,
	getAllPosts
} = require('./src/posts');
const {
	newUser,
	getUser,
	getAllUsers,
	loginUser,
	deactivateUser,
	updateUser,
	addDocumentToUser,
	removeDocumentFromUser
} = require('./src/users');
const {
	uploadDocument,
	getDocument,
	getAllDocuments,
	deleteDocument
} = require('./src/documents');

// Posts
app.get('/api/v1/posts', firebaseAuth, getAllPosts);
app.get('/api/v1/posts/:postID', firebaseAuth, getPost);
app.post('/api/v1/posts', firebaseAuth, newPost);

// Users
app.get('/api/v1/users', firebaseAuth, getAllUsers);
app.get('/api/v1/users/:userID', firebaseAuth, getUser);
app.post('/api/v1/users', firebaseAuth, newUser);
app.post('/api/v1/users/:userID/documents', firebaseAuth, addDocumentToUser);
app.put('/api/v1/users/:userID', firebaseAuth, updateUser);
app.delete('/api/v1/users/:userID', firebaseAuth, deactivateUser); // Requires admin
app.delete('/api/v1/users/:userID/documents/:documentID', firebaseAuth, removeDocumentFromUser); // Requires admin

// Documents
app.get('/api/v1/documents', firebaseAuth, getAllDocuments);
app.get('/api/v1/documents/:documentID', firebaseAuth, getDocument);
app.post('/api/v1/documents', firebaseAuth, uploadDocument);
app.delete('/api/v1/documents/:documentID', firebaseAuth, deleteDocument); // Requires admin

// Login
login.post('/login', loginUser);

exports.api = functions.https.onRequest(app);
exports.login = functions.https.onRequest(login);
