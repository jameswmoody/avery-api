const firebase = require('firebase');
const firebaseConfig = require('../config/firebaseConfig');

const {
	db
} = require('../util/admin');
const {
	isEmpty,
	isEmail,
	removeEmptyParams
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
	let newUserDetails;
	let userID;
	let token;

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
		return res
			.status(400)
			.json({
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
			newUserDetails = {
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
				isDeactivated: false,
				isAdmin: false,
				createdAt: new Date().toISOString(),
				deactivatedAt: null
			};
			return db.doc(`/users/${userID}`).set(newUserDetails);
		})
		.then(() => res
			.status(201)
			.json({
				token
			}))
		.catch((err) => res
			.status(500)
			.json({
				message: 'User could not be created',
				errors: err
			}));
};

const getUser = (req, res) => {
	const {
		userID
	} = req.params;
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
			}
			return res.status(404).json({
				error: `User ${userID} not found`
			});
		})
		.then((userData) => res.json(userData))
		.catch((err) => res
			.status(500)
			.json({
				message: 'Could not get user',
				errors: err
			}));
};

const getAllUsers = (req, res) => db
	.collection('users')
	.orderBy('createdAt', 'desc')
	.get()
	.then((data) => {
		const users = [];

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
	.catch((err) => res
		.status(500)
		.json({
			message: 'Could not get users',
			errors: err
		}));

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
		return res
			.status(400)
			.json({
				message: 'User could not be authenticated',
				errors
			});
	}

	return firebase
		.auth()
		.signInWithEmailAndPassword(email, password)
		.then((UserCredential) => UserCredential.user.getIdToken())
		.then((token) => res.json({
			token
		}))
		.catch((err) => {
			if (err.code === 'auth/wrong-password') {
				return res
					.status(403)
					.json({
						errors: {
							credentials: 'Invalid credentials provided'
						}
					});
			}
			return res
				.status(500)
				.json({
					message: 'User could not be authenticated',
					errors: err
				});
		});
};

const updateUser = (req, res) => {
	const {
		userID
	} = req.params;
	const updatableParams = {
		name: req.body.name,
		gender: req.body.gender,
		dateOfBirth: req.body.dateOfBirth,
		dateOfDeath: req.body.dateOfDeath,
		address: req.body.address,
		facebook: req.body.facebook,
		instagram: req.body.instagram,
		email: req.body.email,
		phone: req.body.phone,
		mother: req.body.mother,
		father: req.body.father,
		description: req.body.description,
		isUser: req.body.isUser,
		isAdmin: req.body.isAdmin
	};
	const updatedUserDetails = removeEmptyParams(updatableParams);

	return db
		.doc(`/users/${userID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return doc.ref.update(updatedUserDetails);
			}
			return res
				.status(404)
				.json({
					error: `User ${userID} not found`
				});
		})
		.then(() => res.json({
			message: `User ${userID} successfully updated`
		}))
		.catch((err) => res
			.status(500)
			.json({
				message: 'User could not be updated',
				error: err
			}));
};

const deactivatedUser = (req, res) => {
	const {
		userID
	} = req.params;
	return db
		.doc(`/users/${userID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return doc.ref.update({
					isDeactivated: true,
					deactivatedAt: new Date().toISOString()
				});
			}
			return res
				.status(404)
				.json({
					error: `User ${userID} not found`
				});
		})
		.then(() => res
			.json({
				message: `User ${userID} successfully deactivated`
			}))
		.catch((err) => res
			.status(500)
			.json({
				message: 'User could not be deleted',
				error: err
			}));
};

const addDocumentToUser = (req, res) => {
	const {
		documentID
	} = req.body;
	const {
		userID
	} = req.params;
	let documents;

	return db
		.doc(`/users/${userID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				documents = doc.data().documents;
				documents.push(documentID);
				return db
					.doc(`/documents/${documentID}`)
					.get();
			}
			return res
				.status(404)
				.json({
					error: `User ${userID} not found`
				});
		})
		.then((doc) => {
			if (doc.exists) {
				const {
					assignedTo
				} = doc.data();
				assignedTo.push(userID);
				return doc.ref.update({
					assignedTo
				});
			}
			return res.status(404).json({
				error: `Document ${documentID} not found`
			});
		})
		.then(() => db
			.doc(`/users/${userID}`)
			.get())
		.then((doc) => doc.ref.update({
			documents
		}))
		.then(() => res.json({
			message: `Document ${documentID} successfully added to user ${userID}`
		}))
		.catch((err) => res.status(500).json({
			message: 'Document could not be added to user',
			error: err
		}));
};

const removeDocumentFromUser = (req, res) => {
	const {
		userID
	} = req.params;
	const {
		documentID
	} = req.params;

	return db
		.doc(`/documents/${documentID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				const assignedTo = doc
					.data()
					.assignedTo.filter((d) => d !== userID);

				return doc.ref.update({
					assignedTo
				});
			}
			return res.status(404).json({
				error: `Document ${documentID} not found`
			});
		})
		.then(() => db.doc(`/users/${userID}`).get())
		.then((doc) => {
			if (doc.exists) {
				const documents = doc
					.data()
					.documents.filter((d) => d !== documentID);
				return doc.ref.update({
					documents
				});
			}
			return res.status(404).json({
				error: `User ${userID} not found`
			});
		})
		.then(() => res.json({
			message: `Document ${documentID} successfully removed from user ${userID}`
		}))
		.catch((err) => res.status(500).json({
			message: 'Could not remove document from user',
			errors: err
		}));
};

module.exports = {
	newUser,
	getUser,
	getAllUsers,
	loginUser,
	deactivatedUser,
	updateUser,
	addDocumentToUser,
	removeDocumentFromUser
};
