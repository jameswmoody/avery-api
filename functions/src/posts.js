
const { db } = require('../util/admin');
const { isEmpty } = require('../util/helpers');

const newPost = (req, res) => {
	const { body, author } = req.body;

	const errors = {};
	if (isEmpty(body)) {
		errors.body = 'A message body must be provided for post';
	} else if (isEmpty(author)) {
		errors.author = 'User ID must be provided for author of post';
	}

	if (Object.keys(errors).length > 0) {
		return res.status(400).json({
			message: 'Post could not be created',
			errors
		});
	}

	const postDetails = {
		author,
		body,
		createdAt: new Date().toISOString(),
		deletedAt: null
	};

	return db
		.collection('posts')
		.add(postDetails)
		.then(() => res.json({
			message: 'Post created successfully'
		}))
		.catch((err) => res.status(500).json({
			message: 'Post could not be created',
			error: err
		}));
};

const getAllPosts = (req, res) => db
	.collection('posts')
	.orderBy('createdAt', 'desc')
	.get()
	.then((data) => {
		const posts = [];

		data.forEach((doc) => {
			const {
				author, body, createdAt, deletedAt
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
	.catch((err) => res.status(500).json({
		message: 'Could not return posts',
		error: err
	}));

const getPost = (req, res) => {
	const { postID } = req.params;
	db.doc(`/posts/${postID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return {
					postID: doc.data().postID,
					author: doc.data().author,
					body: doc.data().body,
					createdAt: doc.data().createdAt,
					deletedAt: doc.data().deletedAt
				};
			}
			return res.status(404).json({
				error: `Post ${postID} not found`
			});
		})
		.then((postData) => res.json(postData))
		.catch((err) => err);
};

const deletePost = (req, res) => {
	const {
		postID
	} = req.params;
	return db
		.doc(`/posts/${postID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return doc.ref.update({
					deletedAt: new Date().toISOString()
				});
			}
			return res.status(404).json({
				error: `Post ${postID} not found`
			});
		})
		.then(() => res.json({
			message: `Post ${postID} successfully deleted`
		}))
		.catch((err) => res.status(500).json({
			message: 'Post could not be deleted',
			error: err
		}));
};

module.exports = {
	newPost,
	getPost,
	deletePost,
	getAllPosts
};
