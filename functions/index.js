const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

app.get('/posts', (req, res) => {
    return admin
        .firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let posts = [];

            data.forEach((doc) => {
                const { author, body, createdAt, deletedAt } = doc.data();

                // Since posts will only be 'soft deleted', deleted posts will be filtered from the reponse
                if (!deletedAt) {
                    posts.push({
                        postID: doc.id,
                        author,
                        body,
                        createdAt,
                        deletedAt
                    });
                }
            });
            return res.json(posts);
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/posts', (req, res) => {
    const newPost = {
        author: req.body.author,
        body: req.body.body,
        createdAt: new Date(),
        deletedAt: null
    };

    return admin
        .firestore()
        .collection('posts')
        .add(newPost)
        .then((doc) => {
            return res.json({
                message: 'Post created successfully'
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                message: 'Post could not be created',
                error: err
            });
        });
});

exports.api = functions.https.onRequest(app);
