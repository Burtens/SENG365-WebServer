const db = require('../../config/db');

exports.getAll = async function (eventId) {

    const sql =  'SELECT e.organizer_id, event_id, user_id, ' +
                'u.first_name, u.last_name, attendance_status_id, date_of_interest FROM event_attendees ' +
                'JOIN event e on event_attendees.event_id = e.id JOIN user u on u.id = event_attendees.user_id ' +
                'WHERE event_id = ? order by date_of_interest';

    return executeSql(sql, [eventId]);
}


exports.addAttendance = async function (eventId, userId) {
    const sql = 'INSERT INTO event_attendees (event_id, user_id, attendance_status_id) VALUES (?, ?, ?)';
    await executeSql(sql, [eventId, userId, 2]);
}

exports.getEventDate = async function (eventId) {
    const sql = 'SELECT date FROM event WHERE id = ?'
    return (await executeSql(sql, [eventId]))[0].date;
}

exports.getAttendanceStatus = async function (eventId, userId) {
    const sql = 'SELECT attendance_status_id FROM event_attendees WHERE event_id = ? AND user_id = ?';
    return (await executeSql(sql, [eventId, userId]))[0].attendance_status_id;
}

exports.removeAttendance = async function (eventId, userId) {
    const sql = 'DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?';
    await executeSql(sql, [eventId, userId]);
}

exports.updateAttendance = async function (eventId, userId, status) {
    const sql = 'UPDATE event_attendees SET attendance_status_id = ? WHERE event_id = ? AND user_id = ?';
    await executeSql(sql, [status, eventId, userId]);
}

async function executeSql(sql, values) {
    const [rows] = await db.getPool().query(sql, values);
    return rows;
}