const events = require('../models/events.model');

// Array of valid sortBy strings
const validSortBy = [
    'ALPHABETICAL_ASC',
    'ALPHABETICAL_DESC',
    'DATE_ASC',
    'DATE_DESC',
    'ATTENDEES_ASC',
    'ATTENDEES_DESC',
    'CAPACITY_ASC',
    'CAPACITY_DESC'
];


// Gets all events in the database
exports.getAll = async function (req, res) {

    const startIndex = parseInt(req.query.startIndex);
    const count = parseInt(req.query.count);
    const q = req.query.q;
    const categoryList = req.query.categoryIds;
    const organizerId = parseInt(req.query.organizerId);
    const sortBy = req.query.sortBy;

    let error = false;

    // Checks if all given values are valid, if they arent return status '400' "Bad Request"
    if (req.query.startIndex !== undefined && (isNaN(startIndex) || startIndex < 0)) {
        error = true;
    } else if (req.query.count !== undefined && (isNaN(count) || count < 0)) {
        error = true;
    } else if (req.query.organizerId !== undefined && (isNaN(organizerId) || organizerId < 0)) {
        error = true;
    } else if (sortBy !== undefined && validSortBy.indexOf(sortBy) === -1) {
        error = true;
    } else if (categoryList !== undefined) {
        for (const category in categoryList) {
            const categoryNum = parseInt(categoryList[category]);
            if (isNaN(categoryNum) || categoryNum < 0) {
                error = true;
            }
        }
    }

    try {
        if (error) { // Sends 'Bad Request' Status
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            let values = await events.getAll(startIndex, count, q, categoryList, organizerId, sortBy);
            for (let value in values) {
                values[value].categories = await convertCategoriesToList(values[value].categories.split(','));
                if (values[value].numAcceptedAttendees === null) {
                    values[value].numAcceptedAttendees = 0;
                }
            }
            res.statusMessage = "OK";
            res.status(200).send(values);
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Adds a new event
exports.addEvent = async function (req, res) {
    const authToken = req.header('X-Authorization');

    const title = req.body.title;
    const categories = req.body.categoryIds;
    const capacity = req.body.capacity;
    const description = req.body.description;
    const date = req.body.date;
    const isOnline = req.body.isOnline;
    const url = req.body.url;
    const venue = req.body.venue;
    const requiresAttendanceControl = req.body.requiresAttendanceControl;
    const fee = req.body.fee;

    try {
        const userId = await events.getID(authToken); // Checks if user is logged in
        if (authToken === undefined || userId.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (!await checkValidValues(title, categories, capacity, description, date,
                            isOnline, url, venue, requiresAttendanceControl, fee, true)) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            const eventId = await events.addEvent(title, capacity, description, date, isOnline, url, venue,
                requiresAttendanceControl, fee, userId[0].id);

            await events.addEventCategories(eventId[0].eventId, categories);

            res.status(201).send(eventId[0]); // Return a json object containing the id of the new event
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Gets the event with id supplied
exports.getOne = async function (req, res) {
    const id = req.params.id;

    try {
        const event = await events.getOne(id); // Attempts to get one event from the database
        if (event.length === 0){
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else {
            res.statusMessage = 'OK';
            event[0].categories =  await convertCategoriesToList(event[0].categories.split(','));
            if (event[0].numAcceptedAttendees === null) {
                event[0].numAcceptedAttendees = 0;
            }
            res.status(200).send(event[0]);
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Updates one event by the values defined given by id
exports.update = async function (req, res) {
    const id = req.params.id;
    const authToken = req.header('X-Authorization');

    const title = req.body.title;
    const categories = req.body.categoryIds;
    const capacity = req.body.capacity;
    const description = req.body.description;
    const date = req.body.date;
    const isOnline = req.body.isOnline;
    const url = req.body.url;
    const venue = req.body.venue;
    const requiresAttendanceControl = req.body.requiresAttendanceControl;
    const fee = req.body.fee;

    try {

        const eventToUpdate = await events.getOne(id);
        const eventOrganiser = await events.getID(authToken);

        if (authToken === undefined || eventOrganiser.length === 0) { // Checks if user is logged in
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (id === undefined || eventToUpdate.length === 0 ) { // Checks if the event exists
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (eventToUpdate[0].organizerId !== eventOrganiser[0].id) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else if (!await checkValidValues(title, categories, capacity, description, date,
            isOnline, url, venue, requiresAttendanceControl, fee, false)) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            await events.updateEvent(id, title, capacity, description, date, isOnline, url, venue,
                requiresAttendanceControl, fee);

            await events.updateCategories(id, categories);

            res.statusMessage = 'OK';
            res.status(200).send();
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Deletes an event
exports.delete = async function (req, res) {
    const id = req.params.id;
    const authToken = req.header('X-Authorization');

    try {

        const eventToDelete = await events.getOne(id);
        const userId = await events.getID(authToken);

        if (authToken === undefined || userId.length === 0) { // Checks if user is logged in
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (id === undefined || eventToDelete.length === 0 ) { // Checks if the event exists
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else if (eventToDelete[0].organizerId !== userId[0].id) {
            res.statusMessage = 'Forbidden';
            res.status(403).send();
        } else {

            await events.deleteEventCategories(id);
            await events.deleteEvent(id);

            res.statusMessage = 'OK';
            res.status(200).send();
        }

    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

exports.getCategories = async function (req, res) {
    try {
        const categories = await events.getCategories();
        res.statusMessage = 'OK';
        res.status(200).send(categories);
    } catch ( err ) {
        console.log( err )
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Checks if given values are correct
async function checkValidValues(title, categories, capacity, description, date,
                                isOnline, url, venue, requiresAttendanceControl, fee, creating) {

    // Checks if all given values when creating an event are valid

    //These options are required when making a new event otherwise they are optional
    if ((title === undefined && creating === true) && typeof title !== "string" || !await events.checkTitle(title)) {
        return false;
    } else if ((categories === undefined && creating === true) && !Array.isArray(categories)) {
        return false;
    } else if ((description === undefined && creating === true) && typeof description !== "string") {
        return false;
    }

    // Optional Values
    if (date !== undefined && (isNaN(Date.parse(date)) || Date.parse(date) <= Date.now())) {
        return false;
    } else if (capacity !== undefined && capacity < 0) {
        return false;
    } else if (isOnline !== undefined && typeof isOnline !== "boolean") {
        return false;
    } else if (url !== undefined && typeof url !== "string") {
        return false;
    } else if (venue !== undefined && typeof venue != "string") {
        return false;
    } else if (requiresAttendanceControl !== undefined && typeof requiresAttendanceControl !== "boolean") {
        return false;
    } else if (fee !== undefined && isNaN(parseInt(fee))) {
        return false;
    } else {
        for (const category in categories) {
            const categoryNum = categories[category];
            if (isNaN(categoryNum) || categoryNum < 0 || !await events.checkCategory(categoryNum)) {
                return false;
            }
        }
    }
    return true;
}


// Converts returned string of categories from db to a list
async function convertCategoriesToList(categories) {
    let newListCategories = [];

    for (let category in categories) {
        newListCategories.push(parseInt(categories[category]));
    }
    return newListCategories;
}