const path = require('path');
const os = require('os');
const fs = require('fs');
const uuid = require('uuid');
const Busboy = require('busboy');

const firebaseConfig = require('../config/firebaseConfig');
const {
	admin,
	db
} = require('../util/admin');

const SUPPORTED_FILE_TYPES = [
	'image/jpeg',
	'image/png',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const uploadDocument = (req, res) => {
	const busboy = new Busboy({
		headers: req.headers
	});
	const fileToken = uuid.v4();
	const fileDetails = {};
	let newDocument;
	let documentToBeUploaded = {};
	let documentFileName;
	let assignTo;
	let fileType;
	let documentID;

	busboy
		.on('file', (fieldname, file, filename, encoding, mimeType) => {
			if (!SUPPORTED_FILE_TYPES.includes(mimeType)) {
				return res.status(400).json({
					errors: {
						file: 'File type not supported'
					}
				});
			}

			const fileExt = filename.split('.')[filename.split('.').length - 1];
			fileType = mimeType;
			documentFileName = `${fileToken}.${fileExt}`;
			const filepath = path.join(os.tmpdir(), documentFileName);
			documentToBeUploaded = {
				filepath,
				mimeType
			};
			return file.pipe(fs.createWriteStream(filepath));
		})
		.on('field', (fieldname, val) => {
			if (fieldname === 'assignTo') {
				assignTo = val;
			} else {
				fileDetails[fieldname] = val;
			}
		})
		.on('finish', () => {
			admin
				.storage()
				.bucket()
				.upload(documentToBeUploaded.filepath, {
					resumable: false,
					metadata: {
						metadata: {
							contentType: documentToBeUploaded.mimeType,
							firebaseStorageDownloadTokens: fileToken
						}
					}
				})
				.then(() => {
					const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${documentFileName}?alt=media&token=${fileToken}`;
					newDocument = {
						fileUrl,
						fileToken,
						displayName: fileDetails.displayName,
						filename: documentFileName,
						fileType,
						documentType: fileDetails.documentType,
						description: fileDetails.description,
						size: fs.readFileSync(documentToBeUploaded.filepath)
							.byteLength,
						assignedTo: [assignTo],
						createdBy: req.user.uid,
						createdAt: new Date().toISOString(),
						deletedAt: null
					};
					return db
						.collection('documents')
						.add(newDocument);
				})
				.then((documentRef) => {
					documentID = documentRef.id;
					return db
						.doc(`/users/${assignTo}`)
						.get();
				})
				.then((doc) => {
					if (doc.exists) {
						const {
							documents
						} = doc.data();
						documents.push(documentID);
						return db
							.doc(`/users/${assignTo}`)
							.update({
								documents
							});
					}
					return res.status(404).json({
						error: 'Could not find user assigned to document'
					});
				})
				.then(() => {
					newDocument.documentID = documentID;
					const createdDocument = Object.assign({
						documentID
					}, newDocument);
					return res.json(createdDocument);
				})
				.catch((err) => res
					.status(500)
					.json({
						message: 'Document could not bSe uploaded',
						error: err
					}));
		});
	busboy.end(req.rawBody);
};

const getDocument = (req, res) => {
	const {
		documentID
	} = req.params;
	db.doc(`/documents/${documentID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return {
					documentID,
					fileUrl: doc.data().fileUrl,
					fileToken: doc.data().fileToken,
					displayName: doc.data().displayName,
					filename: doc.data().filename,
					fileType: doc.data().fileType,
					documentType: doc.data().documentType,
					description: doc.data().description,
					size: doc.data().size,
					assignedTo: doc.data().assignedTo,
					createdBy: doc.data().createdBy,
					createdAt: doc.data().createdAt,
					deletedAt: doc.data().deletedAt
				};
			}
			return res.status(404).json({
				error: `Document ${documentID} not found`
			});
		})
		.then((documentData) => res.json(documentData))
		.catch((err) => res
			.status(500)
			.json({
				message: 'Document could not be returned',
				error: err
			}));
};

const getAllDocuments = (req, res) => db
	.collection('documents')
	.orderBy('createdAt', 'desc')
	.get()
	.then((data) => {
		const documents = [];

		data.forEach((doc) => {
			documents.push({
				documentID: doc.id,
				fileUrl: doc.data().fileUrl,
				fileToken: doc.data().fileToken,
				displayName: doc.data().displayName,
				filename: doc.data().filename,
				fileType: doc.data().fileType,
				documentType: doc.data().documentType,
				description: doc.data().description,
				size: doc.data().size,
				createdBy: doc.data().createdBy,
				createdAt: doc.data().createdAt,
				deletedAt: doc.data().deletedAt
			});
		});
		return res.json(documents);
	})
	.catch((err) => res
		.status(500)
		.json({
			message: 'Could not be return documents',
			error: err
		}));

const deleteDocument = (req, res) => {
	const {
		documentID
	} = req.params;
	return db
		.doc(`/documents/${documentID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return doc.ref.update({
					deletedAt: new Date().toISOString()
				});
			}
			return res.status(404).json({
				error: `Document ${documentID} not found`
			});
		})
		.then(() => res.json({
			message: `Document ${documentID} successfully deleted`
		}))
		.catch((err) => res
			.status(500)
			.json({
				message: 'Document could not be deleted',
				error: err
			}));
};

module.exports = {
	uploadDocument,
	getDocument,
	getAllDocuments,
	deleteDocument
};
