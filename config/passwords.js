let crypto = require('crypto');


// Generates a password hash using email as unique salt
// Uses the 'sha256' algorithm for hashing
exports.hash = async function(password, email) {

    let hash = crypto.createHmac('sha256', email);
    hash.update(password);
    return hash.digest('hex');
}
