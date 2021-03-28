const eventImages = require('../models/events.images.model');
const auth = require('../middleware/authentication.middleware');
const fs = require('fs');

const fileEndings = {
    'image/png' : '.png',
    'image/jpeg' : '.jpg',
    'image/gif' : '.gif'
};

exports.getImage = async function(req, res) {
    const eventId = req.params.id;

    try {
        const images = await eventImages.getImage(eventId);
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

exports.addImage = async function(req, res) {
    const eventId = req.params.id;
    const authToken = req.header('X-Authorization');
    const fileType = req.header('Content-Type');

    const image = req.body;

    try {
        const tokenId = await auth.getID(authToken);
        const userId = tokenId.length === 1 ? tokenId[0].id : undefined;

        if (!Object.keys(fileEndings).includes(fileType)) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else if (userId === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (eventId === undefined || !await auth.eventExists(eventId)) {
                res.statusMessage = 'Not Found';
                res.status(404).send();
        } else if (!await auth.isEventOrganizer(eventId, userId)) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {

            const oldImage =  await eventImages.getImage(eventId);
            const oldImageFileName = oldImage.length === 1 ? oldImage[0].image_filename : null;
            const imageFileName = 'event_' + eventId + fileEndings[fileType];
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

            await eventImages.setImage(imageFileName, eventId);
            res.send();
        }
    } catch ( err ) {
        console.log( err );
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}