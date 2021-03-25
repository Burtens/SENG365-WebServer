const db = require('../../config/db');
const passwords = require('../../config/passwords');



exports.register = async function(firstName, lastName, email, password) {
    const hashPass = await passwords.hash(password);
    const sql = 'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
    const values = [firstName, lastName, email, hashPass];

    await executeSql(sql, values);
    return executeSql('SELECT id AS userId FROM user WHERE email = ?', [email]);

}

exports.login = async function(email) {
    const sql = 'UPDATE user SET auth_token = ? WHERE email = ?'
    const token =  await passwords.generateToken();
    const values = [token, email]

    // Add authToken to current user logging in
    await executeSql(sql, values);

    const rows = await executeSql('SELECT id FROM user WHERE email = ?', [email])

    // Return authToken and user id
    return {
        "userId" : rows[0].id,
        "token": token
    };
}

exports.logout = async function(token) {
    // Sets the authToken of the current logged in user to null
    const sql = 'UPDATE user SET auth_token = null WHERE auth_token = ?';
    await executeSql(sql, [token]);
}

exports.getUser = async function(authToken, id) {
    const sql = 'SELECT first_name, last_name, email, auth_token FROM user WHERE id = ?';
    const rows = await executeSql(sql, [id]);
    const user = rows[0];

    // Return JSON objects with the correct information
    if (user.auth_token === authToken) {
        return {
            "firstName" : user.first_name,
            "lastName" : user.last_name,
            "email" : user.email
        };
    } else {
        return {
            "firstName" : user.first_name,
            "lastName" : user.last_name
        };
    }
}

exports.updateUser = async function(id, firstName, lastName, email, newPassword) {

    let sql = 'UPDATE user SET ';
    let values = []

    if (firstName !== undefined) {
        if (sql === 'UPDATE user SET ') {
            sql += 'first_name = ? ';
        } else {
            sql += ', first_name = ? ';
        }
        values.push(firstName);
    }

    if (lastName !== undefined) {
        if (sql === 'UPDATE user SET ') {
            sql += 'last_name = ? ';
        } else {
            sql += ', last_name = ? ';
        }
        values.push(lastName);
    }

    if (email !== undefined) {
        if (sql === 'UPDATE user SET ') {
            sql += 'email = ? ';
        } else {
            sql += ', email = ? ';
        }
        values.push(email);
    }

    if (newPassword !== undefined) {
        if (sql === 'UPDATE user SET ') {
            sql += 'password = ? ';
        } else {
            sql += ', password = ? ';
        }
        values.push(await passwords.hash(newPassword));
    }

    if (sql !== 'UPDATE user SET ') {
        sql += 'WHERE id = ?';
        values.push(id);
        await executeSql(sql, values);
    }
}

exports.comparePassword = async function(reference, password) {
    let sql;

    // Checks whether user is using email or id to get user.
    if (/.*@.*/.test(reference)) {
        sql = 'SELECT password from user WHERE email = ?';
    } else {
        sql = 'SELECT password from user WHERE id = ?';
    }

    const rows = await executeSql(sql, [reference]);

    return passwords.check(password, rows[0].password);
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