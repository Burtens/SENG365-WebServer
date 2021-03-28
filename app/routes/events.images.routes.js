const eventImages = require('../controllers/events.images.controller');


module.exports = function (app) {

    app.route(app.rootUrl + '/events/:id/image')
        .get( eventImages.getImage )
        .put( eventImages.addImage );

};
