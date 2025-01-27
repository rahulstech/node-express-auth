const users = require('./users.json')

function findUserByUsername( username ) {
    const user = users.find( u => u.username === username)
    return user
}

function checkPassword(user, password) {
    return user.password === password
}

module.exports = { 
    findUserByUsername, checkPassword
}