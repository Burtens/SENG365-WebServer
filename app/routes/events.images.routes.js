const eventImages = require('../controllers/events.images.controller');


module.exports = function (app) {

    app.route(app.rootUrl + '/events/:id/image')
        .get( eventImages.getImage ) // Get an events hero image
        .put( eventImages.addImage ); // Add an image to an event

};
