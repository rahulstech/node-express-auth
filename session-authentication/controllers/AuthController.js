const { findUserByUsername, addNewUser } = require('../database/db')
const { AppError } = require('../utils/errors')
const { authenticateUserCredentials, addSessionTokenForUser, getSessionToken, removeSessionToken } = require('../services/AuthService')


async function login( req, res ) {
    // check user logged in
    if (req.session.token) {
        return res.json({ message: 'you are already logged in'})
    }

    // if not logged in then check credentials
    const body = req.body

    // user send no credentials, bad request
    if (!body) {
        return res.status(400).json({ message: 'username and password required' })
    }

    const { username, password } = body

    const user = await authenticateUserCredentials({ username, password })

    // add token in session
    addSessionTokenForUser(req.session, user)

    // redirect to welcome page
    res.status(200).json({ message: 'successfully logged in'})
}

async function register( req, res) {
    const { body, session } = req

    // if user is loggedin and trying to register then it's a  bad request
    const token = getSessionToken()
    if (token) {
        throw new AppError(400, 'you are already loggedin; logout before register')
    }

    const { username, password, confPassword } = body || {}

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

    // check if any user already exists with the same username, if exists then user can not register
    const existingUser = findUserByUsername(username)
    if (existingUser) {
        throw new AppError(422, `another user already existis with username ${username}`)
    }

    // all inputs are validated, save the user
    const newUser = addNewUser({ username, password })

    // save the user token in session
    addSessionTokenForUser(session, newUser)

    res.status(200).json({ message: 'user registered' })
}

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

module.exports = { login, register, logout }