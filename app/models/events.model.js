const db = require('../../config/db');


exports.getAllEvents = async function(startIndex, count, q, categoryList, organiserId, sortBy) {

    let values = [];

    // Initial SQL string
    let sql = 'SELECT event.id as eventId, title, categories, first_name as organizerFirstName, ' +
              'last_name as organizerLastName, count(distinct user_id) as numAcceptedAttendees, ' +
              'capacity FROM event join user on event.organizer_id = user.id ' +
              'join event_attendees ea on event.id = ea.event_id join event_category ec on event.id = ec.event_id ' +
              'join (SELECT event_id, GROUP_CONCAT(category_id SEPARATOR \', \') ' +
              'as categories from event_category group by event_id) eg on event.id = eg.event_id ';

    sql += 'WHERE ea.attendance_status_id = 1 '

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
                if (!addedCategory || !sql.includes('AND ec.category_id IN')) { // This is in case category list has invalid variables
                    sql += 'AND ec.category_id IN (?';
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