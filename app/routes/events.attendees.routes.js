const eventAttendees = require('../controllers/events.attendees.controller');

module.exports = function (app) {

    app.route(app.rootUrl + '/events/:id/attendees')
        .get( eventAttendees.getAll ) // Retrieve an event's attendees
        .post( eventAttendees.addAttendance ) // Request attendance to an event
        .delete( eventAttendees.removeAttendance ); // Remove an attendee from an event

    app.route(app.rootUrl + '/events/:event_id/attendees/:user_id')
        .patch( eventAttendees.editAttendance ); // Retrieve all data about event categories

};
