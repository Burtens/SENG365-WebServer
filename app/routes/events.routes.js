const events = require('../controllers/events.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/events')
        .get( events.getAll ) // view all events
        .post( events.addEvent ); // add event

    app.route(app.rootUrl + '/events/categories')
        .get( events.getCategories ); // Retrieve all data about event categories

    app.route(app.rootUrl + '/events/:id')
        .get( events.getOne ) // view event with id (id)
        .patch( events.update ) // Change and event's details
        .delete( events.delete ); // Delete an event
};
