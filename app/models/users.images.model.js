const db = require('../../config/db');


exports.getImage = async function(userId) {
    const sql = 'SELECT image_filename FROM user WHERE id = ?';
    return executeSql(sql, [userId]);
}

exports.setImage = async function(imageFileName, userId){
    const sql = 'UPDATE user SET image_filename = ? WHERE id = ?';
    await executeSql(sql, [imageFileName, userId]);
}

exports.deleteImage = async function(userId) {
    const sql = 'UPDATE user SET image_filename = null WHERE id = ?';
    await executeSql(sql, [userId]);
}

async function executeSql(sql, values) {
    const [rows] = await db.getPool().query(sql, values);
    return rows;
}