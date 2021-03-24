const db = require('../../config/db');

const joinSQL = 'FROM event JOIN user ON event.organizer_id = user.id ' +
    'LEFT JOIN event_attendees eventAttendees ON event.id = eventAttendees.event_id ' +
    'JOIN event_category eventCategory ON event.id = eventCategory.event_id ' +
    'LEFT JOIN (SELECT event_id, COUNT(id) AS numAcceptedAttendees ' +
    'FROM event_attendees WHERE attendance_status_id = 1 GROUP BY event_id) ' +
    'AS currAttendees ON event.id = currAttendees.event_id ' +
    'JOIN (SELECT event_id, GROUP_CONCAT( category_id SEPARATOR \', \') ' +
    'AS categories FROM event_category GROUP BY event_id) ' +
    'currCategories ON event.id = currCategories.event_id ';


// Gets all events
exports.getAll = async function(startIndex, count, q, categoryList, organiserId, sortBy) {

    let values = [];

    // Initial SQL string
    let sql = 'SELECT event.id AS eventId, title, categories, first_name AS organizerFirstName, ' +
                'last_name AS organizerLastName, numAcceptedAttendees, capacity ' + joinSQL;

    // Checks if user wants to find events which contain string q in their title
    if ( q !== '' && q !== undefined ) {
        sql += 'AND (description LIKE ? OR title LIKE ?) ';
        values.push('%' + q + '%');
        values.push('%' + q + '%');
    }

    // Checks if user wants to find events of a specific category and adds this to sql query
    if (categoryList !== undefined) {
        let addedCategory = false; // A check to see if a category was added
        for (let i = 0; i < categoryList.length; i++) {
            if (categoryList[i] !== '' && !isNaN(categoryList[i])) {
                if (!addedCategory || !sql.includes('AND eventCategory.category_id IN')) { // This is in case category list has invalid variables
                    sql += 'AND eventCategory.category_id IN (?';
                    addedCategory = true;
                } else {
                    sql += ',?'
                }
                values.push(parseInt(categoryList[i]))
            }
        }
        if (addedCategory) {
            sql += ') ';
        }
    }

    // If user wants to find events by a specific organiser
    if ( !isNaN(organiserId) && organiserId !== undefined ) {
        sql += 'AND event.organizer_id = ? ';
        values.push(organiserId);
    }

    sql += 'GROUP BY event.id ';

    // Get sort column and order
    if (sortBy !== '' && sortBy !== undefined) {
        sql += await getSortBy(sortBy);
    } else {
        sql += await getSortBy('DATE_DESC')
    }

    // Checks if count is defined this determines weather the LIMIT attribute should be added
    if (!isNaN(count) && count !== undefined) {
        // LIMIT offset, count
        sql += 'LIMIT ?, ? '
        // If startIndex is not defined the offset should be 0
        if (isNaN(startIndex) && startIndex !== undefined) {
            values.push(0, count);
        } else {
            values.push(startIndex, count);
        }
    }

    try {
        return await executeSql(sql, values);
        //Run query to get all events
    } catch ( err ) {
        console.log(err);
        throw err;
    }

}

// Adds a new event
exports.addEvent = async function(title, capacity, description, date, isOnline, url, venue,
                                  requiresAttendanceControl, fee, organizerId) {

    let values = [title, description, null, false, null, null, null, false, 0, organizerId];

    let sql = 'INSERT INTO event (title, description, date, is_online, url, venue, capacity, ' +
              'requires_attendance_control, fee, organizer_id) ' +
              'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    if (date !== undefined) {
        values[2] = date;
    }

    if (isOnline !== undefined) {
        values[3] = isOnline;
    }

    if (url !== undefined) {
        values[4] = url;
    }

    if (venue !== undefined) {
        values[5] = venue;
    }

    if (capacity !== undefined) {
        values[6] = capacity;
    }

    if (requiresAttendanceControl !== undefined) {
        values[7] = requiresAttendanceControl;
    }

    if (fee !== undefined) {
        values[8] = fee;
    }

    try {
        await executeSql(sql, values);
        const id = await executeSql('SELECT event.id AS eventId  FROM event WHERE title = ?', [title])

        return id;
    } catch ( err ) {
        console.log(err);
        throw err;
    }
}

// Updates an event with given details
exports.updateEvent = async function (eventId, title, capacity, description, date, isOnline, url, venue,
                                      requiresAttendanceControl, fee) {

    let sql = 'UPDATE event SET ';
    let values = []

    if (title !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'title = ? ';
        } else {
            sql += ', title = ?';
        }
        values.push(title);
    }

    if (capacity !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'capacity = ? ';
        } else {
            sql += ', capacity = ? ';
        }
        values.push(capacity);
    }

    if (description !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'description = ? ';
        } else {
            sql += ', description = ? ';
        }
        values.push(description);
    }

    if (date !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'date = ? ';
        } else {
            sql += ', date = ? ';
        }
        values.push(date);
    }

    if (isOnline !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'is_online = ? ';
        } else {
            sql += ', is_online = ? ';
        }
        values.push(isOnline);
    }

    if (url !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'url = ? ';
        } else {
            sql += ', url = ? ';
        }
        values.push(url);
    }

    if (venue !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'venue = ? ';
        } else {
            sql += ', venue = ? ';
        }
        values.push(venue);
    }

    if (requiresAttendanceControl !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'requires_attendance_control = ? ';
        } else {
            sql += ', requires_attendance_control = ? ';
        }
        values.push(requiresAttendanceControl);
    }

    if (fee !== undefined) {
        if (sql === 'UPDATE event SET ' ) {
            sql += 'fee = ? ';
        } else {
            sql += ', fee = ? ';
        }
        values.push(fee);
    }

    if (sql !== 'UPDATE event SET ') {
        sql += 'WHERE id = ?'
        values.push(parseInt(eventId));
        await executeSql(sql, values);
    }
}

exports.deleteEvent = async function (id) {
    const sql = 'DELETE FROM event where id = ?';
    await executeSql(sql, [id]);
}

// Updates categories related to an event
exports.updateCategories = async function (id, categories) {
    // Deletes current categories
    await this.deleteEventCategories(id);

    // Adds new categories
    await this.addEventCategories(id, categories);
}

// Adds new categories to an event
exports.addEventCategories = async function (id, categories) {
    for (let category in categories) {
        await executeSql('INSERT INTO event_category (event_id, category_id) VALUES (?, ?)',
            [id, categories[category]]);
    }
}

// Deletes all categories relating to an event
exports.deleteEventCategories = async function (id) {
    const sql = 'DELETE FROM event_category WHERE event_id = ?';
    await executeSql(sql, [id])
}

// Checks if a title already exists
exports.checkTitle = async function (title) {
    const sql = 'SELECT title from event ';
    const currTitles = await executeSql(sql,[]);
    for (const checkTitle in currTitles) {
        if (currTitles[checkTitle].title === title) {
            return false;
        }
    }
    return true;
}

// Checks if category exists
exports.checkCategory = async function (category) {

    const sql = 'SELECT id FROM category WHERE id = ?';
    const id = await executeSql(sql, [category]);
    return id.length >= 1; // If there is 1 value then the category does exist
}

// Gets one event
exports.getOne = async function (id) {

    const sql = 'SELECT event.id AS eventId, title, categories, first_name AS organizerFirstName, ' +
            'last_name AS organizerLastName , numAcceptedAttendees, capacity, description, ' +
            'organizer_id AS organizerId, date, is_online AS isOnline, url, venue, ' +
            'requires_attendance_control AS requiresAttendanceControl, fee  ' + joinSQL +
            'WHERE event.id = ? GROUP BY event.id ';

    return await executeSql(sql, [id]);

}

// Gets a users id based on
exports.getID = async function(token) {
    const sql = 'SELECT id FROM user WHERE auth_token = ?';
    return executeSql(sql, [token]);
}

exports.getCategories = async function () {

    const sql = 'SELECT id AS categoryId, name FROM category ORDER BY id';

    return await executeSql(sql, []);
}

async function getSortBy (sortBy) {

    const sortArray = sortBy.split("_");
    let sortString = '';

    // Determine the column to sort by
    switch (sortArray[0]) {
        case 'ALPHABETICAL' :
            sortString += ', event.title ORDER BY event.title '
            break;
        case 'DATE' :
            sortString += ', event.date ORDER BY event.date '
            break;
        case 'ATTENDEES' :
            sortString += ' ORDER BY acceptedAttendees '
            break;
        case 'CAPACITY' :
            sortString += ', event.capacity ORDER BY event.capacity '
            break;
    }

    // Determine the order ether ascending or descending
    switch (sortArray[1]) {
        case 'ASC' :
            break;
        case 'DESC' :
            sortString += 'DESC '
            break;
    }

    return sortString;
}

async function executeSql(sql, values) {
    try {
        const [rows] = await db.getPool().query(sql, values);
        return rows;
    } catch (err) {
        console.log(err.sql);
        throw err;
    }
}