const users = require('../models/users.model');
const auth = require('../middleware/authentication.middleware');

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
        } else if (await auth.checkEmailExists(email, null)) {
            error = true;
        }

        if (error) { // Sends 'Bad Request' Status
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            users.register(firstName, lastName, email, password).then((id) => {
                res.status(201).send(id[0]);
            });
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Logs in current user if their password is valid
exports.login = async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    let error = false;

    try {
        if (!await auth.checkEmailExists(email, null)) {
            error = true;
        } else if (!await users.comparePassword(email, password)) {
            error = true;
        }

        if (error) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
        } else {
            const values = await users.login(email);
            // Returns a JSON object of values required
            res.statusMessage = 'OK'
            res.status(200).send(values);
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Logs out current user if they are logged in
exports.logout = async function(req, res) {
    try {
        const authToken = req.header('X-Authorization');
        if (authToken === undefined || authToken === 'null' || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else {
                await users.logout(authToken);
                res.statusMessage = 'OK';
                res.status(200).send();

        }
    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }
}

// Gets a user with a given id
exports.getUser = async function(req, res) {
    const id = req.params.id;
    const authToken = req.header('X-Authorization');

    try {
        if (!await auth.checkUserExistsId(id)) {
            res.statusMessage = 'Not Found';
            res.status(404).send();
        } else {
            const userData = await users.getUser(authToken, id);
            res.statusMessage = 'OK';
            res.status(200).send(userData);
        }
    } catch (err) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
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
    //
    try {
        if (authToken === undefined || authToken === 'null' || !await auth.isAuthorized(authToken)) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
        } else if (!await auth.checkUserExistsId(id)) {
            res.statusMessage = 'Not Found'
            res.status(404).send();
        } else {
            if (newPassword !== undefined) { // If user wants to change password this should be defined
                if (currPassword === undefined || !await users.comparePassword(id, currPassword)) {
                    error = true
                } else if (newPassword === '' || typeof newPassword !== "string") {
                    error = true;
                }
            }

            // Checks if other supplied values are correct
            if (email !== undefined && (!/.*@.*/.test(email) || await auth.checkEmailExists(email, id))) {
                error = true;
            } else if (lastName !== undefined && (lastName === '' || typeof lastName !== "string")) {
                error = true;
            } else if (firstName !== undefined && (firstName === '' || typeof firstName !== "string")) {
                error = true;
            }

            if (Object.keys(req.body).length === 0 || error) {
                res.statusMessage = 'Bad Request';
                res.status(400).send();
            } else if (!await auth.isCurrUser(id, authToken)) {
                res.statusMessage = 'Forbidden';
                res.status(403).send();
            } else {
                await users.updateUser(id, firstName, lastName, email, newPassword);
                res.statusMessage = 'OK';
                res.status(200).send();
            }
        }
    } catch ( err ) {
        console.log(err);
        res.statusMessage = 'Internal Server Error';
        res.status(500).send();
    }

}
