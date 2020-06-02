'use strict';

const {
    admin,
    db
} = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization = req.headers.authorization.split('Bearer ')[1];
    } else {
        return res.status(401).json({
            errors: 'Unauthorized'
        });
    }
    return admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then(() => {
            return next();
        })
        .catch(err => {
            console.error('An error occurred while verifying token: ', err);
            return res.status(401).json({
                errors: err
            });
        })
};