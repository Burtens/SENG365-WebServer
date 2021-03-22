const db = require('../../config/db');
const passwords = require('../../config/passwords');



exports.register = async function(firstName, lastName, email, password) {
    const hashPass = await passwords.hash(password);
    const sql = 'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
    const values = [firstName, lastName, email, hashPass];

    await executeSql(sql, values);
    return executeSql('SELECT id FROM user WHERE email = ?', [email]);

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
            "first_name" : user.first_name,
            "last_name" : user.last_name,
            "email" : user.email
        };
    } else {
        return {
            "first_name" : user.first_name,
            "last_name" : user.last_name
        };
    }
}

exports.updateUser = async function(id, firstName, lastName, email, newPassword) {

    let sql = '';
    let values = []

    if (firstName !== undefined) {
        if (!sql.includes('UPDATE user SET ')){
            sql += 'UPDATE user SET ';
        }
        sql += 'first_name = ? '
        values.push(firstName);
    }

    if (lastName !== undefined) {
        if (!sql.includes('UPDATE user SET ')){
            sql += 'UPDATE user SET ';
        }
        sql += 'last_name = ? '
        values.push(lastName);
    }

    if (email !== undefined) {
        if (!sql.includes('UPDATE user SET ')){
            sql += 'UPDATE user SET ';
        }
        sql += 'email = ? '
        values.push(email);
    }

    if (newPassword !== undefined) {
        if (!sql.includes('UPDATE user SET ')){
            sql += 'UPDATE user SET ';
        }
        sql += 'password = ? '
        values.push(await passwords.hash(newPassword));
    }

    if (sql !== '') {
        sql += 'WHERE id = ?'
        values.push(id);
    }

    await executeSql(sql, values);
}


exports.checkEmailExists = async function(email) {
    const sql = 'SELECT email from user WHERE email = ?';
    const rows = await executeSql(sql, [ email ]);

    // If rows is greater than 0 the email exists
    return rows.length > 0;
}

exports.checkIdExists = async function(id) {
    const sql = 'SELECT id from user WHERE id = ?';
    const rows = await executeSql(sql, [ id ]);

    // If rows is greater than 0 the email exists
    return rows.length > 0;
}

exports.isAuthorized = async function(id, authToken) {
    const sql = 'SELECT auth_token FROM user WHERE id = ?'
    const rows = await executeSql(sql, [id]);

    // Checks to see if users auth_token is the same as the one stored in the database
    return rows[0].auth_token === authToken;

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