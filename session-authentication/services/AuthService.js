const { findUserByUsername, checkPassword } = require('../database/db')
const { AppError, catchErrorAsync } = require('../utils/errors')

const authenticateUserCredentials = async ({ username, password }) => {

    // find user by username
    const user = findUserByUsername(username)

    // if not found then throw no user for username
    if (!user) {
        throw new AppError(401, 'username not found')
    }

    // if found next check password, if does not match then throw
    if (!checkPassword(user, password)) {
        throw new AppError(401, 'incorrect password')
    }

    // all credentials matched, return the user
    return user
}

const validateUser = catchErrorAsync(async (req, res, next) => {
    // get the token from session
    const { token } = req.session

    // if token does not exists, means user not logged in
    if (!token) {
        throw new AppError(401, 'not logged in')
    }

    // token is the username, find user by username
    const user = findUserByUsername(token)

    // user successfully validate, add the user object to the request obejct
    // now i can proceed 
    req.user = user
    next()
})

module.exports = { 
    authenticateUserCredentials, validateUser
}