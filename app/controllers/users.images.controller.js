const usersImages = require('../models/users.images.model');
const auth = require('../middleware/authentication.middleware');
const fs = require('fs');

const fileEndings = {
    'image/png' : '.png',
    'image/jpeg' : '.jpg',
    'image/gif' : '.gif'
};

exports.getImage = async function(req, res) {
    const userId = req.params.id;

    try {
        const images = await usersImages.getImage(userId);

        const imageFileName = images.length === 1 ? images[0].image_filename : null;
        const imagePath = 'storage/images/' + imageFileName;
        if (!fs.existsSync(imagePath)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else {
            res.statusMessage = 'OK';
            res.status(200).sendFile(imageFileName, {root: 'storage/images'});
        }

    } catch ( err ) {
        console.log( err );
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

exports.setImage = async function(req, res) {
    const userToUpdateId = req.params.id;
    const authToken = req.header('X-Authorization');
    const fileType = req.header('Content-Type');

    const image = req.body;

    try {
        if (!Object.keys(fileEndings).includes(fileType)) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else if (authToken === undefined || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (userToUpdateId === undefined || !await auth.checkUserExistsId(userToUpdateId)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (!await auth.isCurrUser(userToUpdateId, authToken)) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {

            const oldImage =  await usersImages.getImage(userToUpdateId);
            const oldImageFileName = oldImage.length === 1 ? oldImage[0].image_filename : null;
            const imageFileName = 'user_' + userToUpdateId + fileEndings[fileType];
            const filePath = 'storage/images/' + imageFileName;

            if (oldImageFileName !== null) {
                res.statusMessage = 'OK';
                res.status(200);
            } else {
                res.statusMessage = 'Created';
                res.status(201);
            }

            fs.unlink('storage/images/' + oldImageFileName, function () {
                fs.writeFile(filePath, image, function (err) {
                    if (err) throw err;
                });
            });

            await usersImages.setImage(imageFileName, userToUpdateId);
            res.send();
        }
    } catch ( err ) {
        console.log( err );
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

exports.deleteImage = async function(req, res) {
    const userToUpdateId = req.params.id;
    const authToken = req.header('X-Authorization');

    try {
        const oldImage =  await usersImages.getImage(userToUpdateId);
        const oldImageFileName = oldImage.length === 1 ? oldImage[0].image_filename : null;

        if (authToken === undefined || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (userToUpdateId === undefined || !await auth.checkUserExistsId(userToUpdateId)
            || oldImageFileName === null) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (!await auth.isCurrUser(userToUpdateId, authToken)) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {

            fs.unlink('storage/images/' + oldImageFileName, function () {});

            await usersImages.deleteImage(userToUpdateId);

            res.statusMessage = 'OK';
            res.status(200).send();
        }
    } catch ( err ) {
        console.log( err );
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}