const db = require('../../config/db');

// Checks if email exists
exports.checkEmailExists = async function(email, userId) {
    const sql = 'SELECT id, email from user WHERE email = ?';
    const rows = await executeSql(sql, [ email ]);

    // If a userId isn't null we will check if the email belongs to the current user
    // This is used to allow the user to patch with the same email.
    if (userId !== null) {
        if (rows.length === 1) {
            return rows[0].id !== parseInt(userId);
        } else {
            return false;
        }
    } else {
        return rows.length > 0;
    }
}

// Checks if given userId exists
exports.checkUserExistsId = async function(id) {
    const sql = 'SELECT id from user WHERE id = ?';
    const rows = await executeSql(sql, [ id ]);

    // If rows is equal to one than 1 the user exists
    return rows.length === 1;
}

// Checks if user is logged in by seeing if a token matches the one given
exports.isAuthorized = async function(token) {
    const sql = 'SELECT id from user WHERE auth_token = ?';
    const rows = await executeSql(sql, [ token ]);

    // If rows is equal to 1 the token is valid
    return rows.length === 1;
}


// Checks if a user is the event organizer
exports.isEventOrganizer = async function(eventId, userId) {

    const sql = 'SELECT organizer_id FROM event WHERE id = ?'
    const rows = await executeSql(sql, [eventId])

    return rows.length === 1 ? rows[0].organizer_id === userId : false;

}

// Checks to see if the auth token matches the users auth_token
exports.isCurrUser = async function(id, authToken) {
    const sql = 'SELECT auth_token FROM user WHERE id = ?'
    const rows = await executeSql(sql, [id]);

    return rows.length === 1 ? rows[0].auth_token === authToken : false;
}

// Gets a users id based on authentication token
exports.getID = async function(token) {
    const sql = 'SELECT id FROM user WHERE auth_token = ?';
    return executeSql(sql, [token]);
}

exports.eventExists = async function (eventId) {
    const sql = 'SELECT id FROM event WHERE id = ?';
    return (await executeSql(sql, [eventId])).length === 1;
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