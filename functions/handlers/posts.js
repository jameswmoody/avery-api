'use strict';

const {
    db
} = require('../util/admin');
const {
    isEmpty
} = require('../util/helpers');

const newPost = (req, res) => {
    const {
        body,
        author
    } = req.body;

    const errors = {};
    if (isEmpty(body)) {
        errors.body = 'A message body must be provided for post'
    } else if (isEmpty(author)) {
        errors.author = 'User ID must be provided for author of post'
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'Post could not be created',
            errors
        });
    }

    const newPost = {
        author,
        body,
        createdAt: new Date().toISOString(),
        deletedAt: null
    };

    return db
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
};

const getAllPosts = (req, res) => {
    return db
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let posts = [];

            data.forEach((doc) => {
                const {
                    author,
                    body,
                    createdAt,
                    deletedAt
                } = doc.data();

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

};
// const getPost = () => {

// };



module.exports = {
    newPost,
    // getPost,
    getAllPosts
}