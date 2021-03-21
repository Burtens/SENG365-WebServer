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

exports.getAllEvents = async function (req, res) {


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
    } else if (!error && req.query.count !== undefined && (isNaN(count) || count < 0)) {
        error = true;
    } else if (!error && req.query.organizerId !== undefined && (isNaN(organizerId) || organizerId < 0)) {
        error = true;
    } else if (!error && sortBy !== undefined && validSortBy.indexOf(sortBy) === -1) {
        error = true;
    } else if (!error && categoryList !== undefined) {
        for (const category in categoryList) {
            const categoryNum = parseInt(categoryList[category]);
            if (isNaN(categoryNum) || categoryNum < 0) {
                error = true;
            }
        }
    }

    try {
        if (error) { // Sends 'Bad Request' Status
            res.status(400).send('Bad Request');
        } else {
            let values = await events.getAllEvents(startIndex, count, q, categoryList, organizerId, sortBy);
            for (let value in values) {
                values[value].categories = await convertCategoriesToList(values[value].categories.split(','));
            }
            res.statusMessage = "OK";
            res.status(200).send(values);
        }
    } catch ( err ) {
        res.status(500).send('Internal Server Error');
    }
}


// Converts returned string of categories from db to a list
async function convertCategoriesToList(categories) {
    let newListCategories = [];

    for (let category in categories) {
        newListCategories.push(parseInt(categories[category]));
    }
    return newListCategories;
}