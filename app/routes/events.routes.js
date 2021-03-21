const events = require('../controllers/events.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/events')
        .get( events.getAllEvents ) // view all events
        .post(); // add event

    app.route(app.rootUrl + '/events/:id')
        .get() // view event with id (id)
        .patch() // Change and event's details
        .delete(); // Delete an event

    app.route(app.rootUrl + '/events/categories')
        .get() // Retrieve all data about event categories
};
