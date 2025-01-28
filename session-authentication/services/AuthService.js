const { findUserByUsername } = require('../database/db')
const { AppError } = require('../utils/errors')

/** 
 * @param { Session } session
 * @param { { username: string } } user  
 */
function addSessionTokenForUser( session, user ) {
    if (session && user) {
        session.token = user.username
    }
}

/**
 * 
 * @param { Session } session 
 * @returns { string | null } 
 */
function getSessionToken( session ) {
    if (session && session.token) {
        return session.token
    }
    return null
}

/**
 * 
 * @param { { password: string }} user 
 * @param { string } testPassword 
 * @returns { boolean }
 */ 
async function checkPassword( user, testPassword ) {
    if (user) {
        return user.password === testPassword
    }
    return false
}

const authenticateUserCredentials = async ({ username, password }, role = 'user') => {

    // find user by username
    const user = findUserByUsername(username)

    // if not found then throw no user for username
    if (!user) {
        throw new AppError(401, 'username not found')
    }

    // check that user role is same as required role
    if (user.role !== role) {
        throw new AppError(401, `only users with role '${role}' are allowed`)
    }

    // if found next check password, if does not match then throw
    if (!(await checkPassword(user, password))) {
        throw new AppError(401, 'incorrect password')
    }

    // all credentials matched, return the user
    return user
}

const validateUser = async (req, res, next) => {
    // get the token from session
    const token = getSessionToken(req.session)

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
}

module.exports = { 
    authenticateUserCredentials, validateUser, addSessionTokenForUser, getSessionToken, checkPassword,
}