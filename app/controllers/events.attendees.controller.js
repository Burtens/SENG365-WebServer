const eventsAttendees = require('../models/events.attendees.model');
const auth = require('../middleware/authentication.middleware')

const statusCodes = {
    '1' : 'accepted',
    '2' : 'pending',
    '3' : 'rejected'
};

const statusIds = {
    'accepted' : '1',
    'pending' : '2',
    'rejected' : '3'
}


exports.getAll = async function(req, res) {
    const authToken = req.header('X-Authorization');
    const eventId = req.params.id;
    let returnList = [];

    try {
        const currAttendees = await eventsAttendees.getAll(eventId);

        if (!await auth.eventExists(eventId)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else {
            if (currAttendees.length !== 0) { // Checks if there are any attendees for an event
                const tokenId = await auth.getID(authToken);
                const userId = tokenId.length === 1 ? tokenId[0].id : undefined;
                const isOwner = userId === currAttendees[0].organizer_id;
                for (let attendee in currAttendees) {

                    if (isOwner) {
                        returnList.push({
                            "attendeeId": currAttendees[attendee].user_id,
                            "status": statusCodes[currAttendees[attendee].attendance_status_id],
                            "firstName": currAttendees[attendee].first_name,
                            "lastName": currAttendees[attendee].last_name,
                            "dateOfInterest": currAttendees[attendee].date_of_interest
                        });
                    } else {
                        if (currAttendees[attendee].attendance_status_id === 1
                            || userId === currAttendees[attendee].user_id) {
                            returnList.push({
                                "attendeeId": currAttendees[attendee].user_id,
                                "status": statusCodes[currAttendees[attendee].attendance_status_id],
                                "firstName": currAttendees[attendee].first_name,
                                "lastName": currAttendees[attendee].last_name,
                                "dateOfInterest": currAttendees[attendee].date_of_interest
                            });
                        }
                    }
                }
            }
            res.statusMessage = 'OK';
            res.status(200).send(returnList);
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }

}

exports.addAttendance = async function(req, res){
    const authToken = req.header('X-Authorization');
    const eventId = req.params.id;
    try {
        const currAttendees = await eventsAttendees.getAll(eventId);
        const tokenId = await auth.getID(authToken);
        const userId = tokenId.length === 1 ? tokenId[0].id : undefined;

        if (authToken === undefined || authToken === 'null' || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (!await auth.eventExists(eventId)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (await isAlreadyAttending(currAttendees, userId) ||
                    await eventsAttendees.getEventDate(eventId) < Date.now()) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {
            await eventsAttendees.addAttendance(eventId, userId);
            res.statusMessage = 'OK';
            res.status(201).send();
        }

    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

exports.removeAttendance = async function(req, res) {
    const authToken = req.header('X-Authorization');
    const eventId = req.params.id;

    try {
        const currAttendees = await eventsAttendees.getAll(eventId);
        const tokenId = await auth.getID(authToken);
        const userId = tokenId.length === 1 ? tokenId[0].id : undefined;

        if (authToken === undefined || authToken === 'null' || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (!await auth.eventExists(eventId)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (!await isAlreadyAttending(currAttendees, userId) ||
                        await eventsAttendees.getEventDate(eventId) < Date.now() ||
                        await eventsAttendees.getAttendanceStatus(eventId, userId) === 3) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {
            await eventsAttendees.removeAttendance(eventId, userId);
            res.statusMessage = 'OK';
            res.status(200).send();
        }


    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

exports.editAttendance = async function(req, res) {
    const authToken = req.header('X-Authorization');
    const eventId = req.params.event_id;
    const userToEditId = req.params.user_id;
    const status = req.body.status;

    try {

        const tokenId = await auth.getID(authToken);
        const userId = tokenId.length === 1 ? tokenId[0].id : undefined;

        if (authToken === undefined || authToken === 'null' || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (!await auth.isEventOrganizer(eventId, userId)) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else if (!await auth.eventExists(eventId) || !await auth.checkUserExistsId(userToEditId)) {
        res.statusMessage = 'Not Found';
        res.status(404).send();
        } else if (![statusCodes[1],statusCodes[2],statusCodes[3]].includes(status)) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            await eventsAttendees.updateAttendance(eventId, userToEditId, statusIds[status]);
            res.statusMessage='OK';
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

async function isAlreadyAttending(currAttendees, userId) {
    for (let attendee in currAttendees) {
        if (currAttendees[attendee].user_id === userId) {
            return true;
        }
    }
    return false
}
