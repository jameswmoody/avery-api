'use strict';

const firebase = require('firebase');
const {
    isEmpty
} = require('../util/helpers');

const loginUser = (req, res) => {
    const {
        email,
        password
    } = req.body;

    const errors = {};

    if (isEmpty(email) || isEmpty(password)) {
        errors.credentials = 'Invalid credentials provided';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'User could not be created',
            errors
        });
    }

    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then(UserCredential => {
            return UserCredential.user.getIdToken();
        })
        .then(token => {
            return res.json({
                token
            })
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({
                    errors: {
                        credentials: 'Invalid credentials provided'
                    }
                });
            }
            return res.status(500).json({
                message: 'Login failed',
                errors: err
            });
        });
};

module.exports = {
    loginUser
};