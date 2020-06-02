'use strict';

const firebase = require('firebase');
const firebaseConfig = require('../config/firebaseConfig');
const {
    db
} = require('../util/admin');
const {
    isEmpty,
    isEmail
} = require('../util/helpers');

firebase.initializeApp(firebaseConfig);

const newUser = (req, res) => {
    const {
        name,
        gender,
        dateOfBirth,
        email,
        password,
        confirmPassword
    } = req.body;
    let newUser, userID, token;

    const errors = {};

    if (isEmpty(name)) {
        errors.name = 'Name must be provided';
    }

    if (isEmpty(email)) {
        errors.email = 'Email address cannot be empty';
    } else if (!isEmail(email)) {
        errors.email = `${email} is not a valid email address`;
    }

    if (isEmpty(password)) {
        errors.password = 'Password must be provided';
    } else if (password !== confirmPassword) {
        errors.password = 'User could not be created, password does not match';
    }

    if (isEmpty(gender)) {
        errors.gender = 'Gender must be provided';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            message: 'User could not be created',
            errors
        });
    }

    return firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((UserCredential) => {
            userID = UserCredential.user.uid;
            return UserCredential.user.getIdToken();
        })
        .then((accessToken) => {
            token = accessToken;
            newUser = {
                userID,
                name,
                photoURL: null,
                gender,
                dateOfBirth,
                dateOfDeath: null,
                address: null,
                facebook: null,
                instagram: null,
                email,
                phone: null,
                mother: null,
                father: null,
                documents: [],
                description: '',
                isUser: true,
                isDeactivated: 'false',
                isAdmin: 'false',
                createdAt: new Date().toISOString(),
                deactivatedAt: null
            };
            return db
                .doc(`/users/${userID}`)
                .set(newUser);
        })
        .then(() => {
            return res.status(201).json({
                token
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                message: 'User could not be created',
                errors: err
            });
        });
};

const getUser = (req, res) => {
    const userID = req.params.userID;
    db.doc(`/users/${userID}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return {
                    userID,
                    name: doc.data().name,
                    photoURL: doc.data().photoURL,
                    gender: doc.data().gender,
                    dateOfBirth: doc.data().dateOfBirth,
                    dateOfDeath: doc.data().dateOfDeath,
                    address: doc.data().address,
                    facebook: doc.data().facebook,
                    instagram: doc.data().instagram,
                    email: doc.data().email,
                    phone: doc.data().phone,
                    mother: doc.data().mother,
                    father: doc.data().father,
                    documents: doc.data().documents,
                    description: doc.data().description,
                    isUser: doc.data().isUser,
                    isDeactivated: doc.data().isDeactivated,
                    isAdmin: doc.data().isAdmin,
                    createdAt: doc.data().createdAt,
                    deactivatedAt: doc.data().deactivatedAt
                };
            } else {
                return res
                    .status(404)
                    .json({
                        error: `User ${userId} not found`
                    });
            }
        })
        .then((userData) => {
            return res.json(userData);
        })
        .catch((err) => {
            return err;
        });
};

const getAllUsers = (req, res) => {
    return db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let users = [];

            data.forEach((doc) => {
                users.push({
                    userID: doc.id,
                    name: doc.data().name,
                    photoURL: doc.data().photoURL,
                    gender: doc.data().gender,
                    dateOfBirth: doc.data().dateOfBirth,
                    dateOfDeath: doc.data().dateOfDeath,
                    address: doc.data().address,
                    facebook: doc.data().facebook,
                    instagram: doc.data().instagram,
                    email: doc.data().email,
                    phone: doc.data().phone,
                    mother: doc.data().mother,
                    father: doc.data().father,
                    documents: doc.data().documents,
                    description: doc.data().description,
                    isUser: doc.data().isUser,
                    isDeactivated: doc.data().isDeactivated,
                    isAdmin: doc.data().isAdmin,
                    createdAt: doc.data().createdAt,
                    deactivatedAt: doc.data().deactivatedAt
                });
            });
            return res.json(users);
        })
        .catch((err) => {
            console.error(err);
        });
};

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
            message: 'User could not be authenticated',
            errors
        });
    }

    return firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
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
                message: 'User could not be authenticated',
                errors: err
            });
        });
};

const removeDocumentFromUser = (req, res) => {
    const userID = req.params.userID;
    const documentID = req.params.documentID;

    return db
        .doc(`/documents/${documentID}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const assignedTo = doc
                    .data().assignedTo
                    .filter(d => d !== userID);

                return doc
                    .ref
                    .update({
                        assignedTo
                    });
            } else {
                return res
                    .status(404)
                    .json({
                        error: `Document ${documentID} not found`
                    });
            }
        })
        .then(() => {
            return db
                .doc(`/users/${userID}`)
                .get();
        })
        .then((doc) => {
            if (doc.exists) {
                const documents = doc.data().documents.filter(d => d !== documentID);
                return doc
                    .ref
                    .update({
                        documents
                    });
            } else {
                return res
                    .status(404)
                    .json({
                        error: `User ${userID} not found`
                    });
            }
        })
        .then(() => {
            return res.json({
                message: `Document ${documentID} successfully removed from user ${userID}`
            });
        })
        .catch((err) => {
            return err;
        });
}

module.exports = {
    newUser,
    getUser,
    getAllUsers,
    loginUser,
    removeDocumentFromUser
};