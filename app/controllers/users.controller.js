const users = require('../models/users.model');

// Registers a new user
exports.register = async function(req, res) {

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    let error = false;

    // This is to ensure that any database related issues are caught
    try {
        if (!/.*@.*/.test(email)) {
            error = true;
        } else if (password === undefined || password === '' || typeof password !== "string") {
            error = true;
        } else if (firstName === undefined || lastName === undefined) {
            error = true;
        } else if (firstName === '' || lastName === '') {
            error = true;
        } else if (await users.checkEmailExists(email)) {
            error = true;
        }

        if (error) { // Sends 'Bad Request' Status
            res.status(400).send('Bad Request');
        } else {
            users.register(firstName, lastName, email, password).then((id) => {
                res.status(201).send(id[0]);
            });
        }
    } catch ( err ) {
        res.status(500).send('Internal Server Error');
    }
}

// Logs in current user if their password is valid
exports.login = async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    let error = false;

    try {
        if (!await users.checkEmailExists(email)) {
            error = true;
        } else if (!await users.comparePassword(email, password)) {
            error = true;
        }

        if (error) {
            res.status(400).send('Bad Request');
        } else {
            const values = await users.login(email);
            // Returns a JSON object of values required
            res.status(200).send(values);
        }
    } catch ( err ) {
        res.status(500).send('Internal Server Error');
    }
}

// Logs out current user if they are logged in
exports.logout = async function(req, res) {
    const authToken = req.header('X-Authorization');
    if (authToken === undefined || authToken === null) {
        res.status(401).send('Unauthorized');
    } else {
        try {
            await users.logout(authToken);
            res.status(200).send('OK');
        } catch (err) {
            res.status(500).send('Internal Server Error');
        }
    }
}

// Gets a user with a given id
exports.getUser = async function(req, res) {
    const id = req.params.id;
    const authToken = req.header('X-Authorization');

    try {
        if (!await users.checkIdExists(id)) {
            res.status(404).send('Not Found');
        } else {
            const userData = await users.getUser(authToken, id);
            res.status(200).send(userData);
        }
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
}

// Updates a users details
exports.updateUser = async function(req, res) {
    const id = req.params.id;
    const authToken = req.header('X-Authorization');

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const newPassword = req.body.password;
    const currPassword = req.body.currentPassword;

    let error = false;
    let forbidden = false;

    try {
        if (authToken === undefined || !await users.isAuthorized(id, authToken)) { // Checks if user is allowed to preform this action
            res.status(400).send('Unauthorized');
        } else {
            if (newPassword !== undefined) { // If user wants to change password this should be defined
                if (currPassword === undefined || !await users.comparePassword(id, currPassword)) {
                    forbidden = true;
                } else if (newPassword === '' || typeof newPassword !== "string") {
                    error = true;
                }
            }

            // Checks if other supplied values are correct
            if (email !== undefined && (!/.*@.*/.test(email) || await users.checkEmailExists(email))) {
                error = true;
            } else if (lastName !== undefined && (lastName === '' || typeof lastName !== "string")) {
                error = true;
            } else if (firstName !== undefined && (firstName === '' || typeof firstName !== "string")) {
                error = true;
            }

            if (error) {
                res.status(400).send('Bad Request');
            } else if (forbidden) {
                res.status(403).send('Forbidden');
            } else {
                await users.updateUser(id, firstName, lastName, email, newPassword);
                res.status(200).send("OK");
            }
        }
    } catch ( err ) {
        res.status(500).send('Internal Server Error');
    }

}
