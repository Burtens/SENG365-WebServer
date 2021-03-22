const bcrypt = require('bcrypt');
const saltRounds = 10;

// Using bcrypt to hash password
exports.hash = async function(password) {
    return bcrypt.hashSync(password, saltRounds);
}

// Using bcrypt to compare passwords
exports.check = async function(password, storedPassword) {
    return bcrypt.compareSync(password, storedPassword);
}

// Generates a random token using salt generator from bcrypt
exports.generateToken = async function() {
    return bcrypt.genSalt(2);
}
