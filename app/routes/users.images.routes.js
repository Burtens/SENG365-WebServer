const usersImages = require('../controllers/users.images.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/users/:id/image')
        .get( usersImages.getImage ) // Get a users image
        .put( usersImages.setImage ) // Set a users profile image
        .delete( usersImages.deleteImage ); // Delete a users profile image

};
