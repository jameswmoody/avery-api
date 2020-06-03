const {
	db
} = require('./admin');

const isEmpty = (string) => !string || string.trim() === '';

const isEmail = (email) => {
	const emailRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email.match(emailRegEx)) {
		return true;
	}
	return false;
};

const removeEmptyParams = (body) => {
	const paramsWithValues = {};
	const paramNames = Object.keys(body);
	paramNames.forEach((name) => {
		if (body[name]) {
			paramsWithValues[name] = body[name];
		}
	});
	return paramsWithValues;
};

const isAdmin = (user) => {
	db
		.doc(`/users/${user.uid}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return doc.data().isAdmin;
			}
			return false;
		})
		.catch((err) => err);
};

module.exports = {
	isEmpty,
	isEmail,
	removeEmptyParams,
	isAdmin
};
