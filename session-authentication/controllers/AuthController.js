const { findUserByUsername, addNewUser } = require('../database/db')
const { AppError } = require('../utils/errors')
const { authenticateUserCredentials, addSessionTokenForUser, getSessionToken } = require('../services/AuthService')
const { canCreate } = require('../services/AuthorizationService')

////////////////////////////////////////////
///                 Log In              ///
//////////////////////////////////////////

async function handleLogin( req, res, role = 'user') {
    // if not logged in then check credentials
    const body = req.body

    // user send no credentials, bad request
    if (!body) {
        throw new AppError(400, 'username and password required')
    }

    const user = await authenticateUserCredentials(body, role)

    // add token in session
    addSessionTokenForUser(req.session, user)

    // redirect to welcome page
    res.status(200).json({ message: 'successfully logged in'})
}

async function login( req, res ) {
    await handleLogin(req,res)
}

async function adminLogin( req, res ) {
    await handleLogin(req, res, 'admin')
}

////////////////////////////////////////////
///             Registration            ///
//////////////////////////////////////////

async function handleRegistration( req, res, myRole, targetRole) {
    const { body } = req

    const { username, password, confPassword, role } = body || {}

    // validate the user input 

    const validationErrorMessages = []
    let valid = true

    if (!username) {
        valid = false
        validationErrorMessages.push('username not provided')
    }
    if (!password) {
        valid = false
        validationErrorMessages.push('password not provided')
    }
    if (!confPassword) {
        valid = false
        validationErrorMessages.push('confirm password not provided')
    }
    if (password && confPassword && password !== confPassword) {
        valid = false
        validationErrorMessages.push('password does not match confirm password')
    }

    // if all inputs are not valid then send bad request
    if (!valid) {
        const message = validationErrorMessages.join('\n')
        throw new AppError(400,message)
    }

    const userRole = role || targetRole

    // authorize
    if (!canCreate(myRole, 'users', userRole)) {
        throw new AppError(401, `can not create user do you previlege constraint`)
    }

    // check if any user already exists with the same username, if exists then user can not register
    const existingUser = findUserByUsername(username)
    if (existingUser) {
        throw new AppError(422, `another user already existis with username ${username}`)
    }

    // all inputs are validated, save the user
    return addNewUser({ username, password, role: userRole })
}

async function register(req, res) {

    const { session, user } = req

    // if user is logged, then registration is not allowed
    if (user) {
        throw new AppError(400, 'user already logged in; can not register')
    }

    // now perform registration
    const newUser = await handleRegistration(req, res, 'user', 'user')

    // add session token for user
    addSessionTokenForUser(session, newUser)

    res.status(200).json({ message: 'user registered' })
}

async function registerAdmin(req, res) {

    const { session, user } = req

    // admin can register himself or register new admin or user if logged in
    const newUser = await handleRegistration(req, res, 'admin', 'user')

    // currently not loggedin, so add the session token
    if (!user) {
        addSessionTokenForUser(session, newUser)
    }

    res.status(200).json({ message: 'user registered' })
}

////////////////////////////////////////////
///             Log Out                 ///
//////////////////////////////////////////

async function logout( req, res, next) {

    req.session.destroy((err) => {
        if(err) {
            console.log(err)
            next(new AppError(500))
            return
        }
        res.status(200).json({ message: 'user logged out successfully'})
    })
}

module.exports = { login, adminLogin, register, registerAdmin, logout }