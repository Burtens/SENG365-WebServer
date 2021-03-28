const db = require('../../config/db');


exports.getImage = async function(eventId) {
    const sql = 'SELECT image_filename FROM event WHERE id = ?';
    return executeSql(sql, [eventId]);
}

exports.setImage = async function(imageFileName, eventId){
    const sql = 'UPDATE event SET image_filename = ? WHERE id = ?';
    await executeSql(sql, [imageFileName, eventId]);
}

async function executeSql(sql, values) {
    const [rows] = await db.getPool().query(sql, values);
    return rows;
}