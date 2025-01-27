const express = require('express')
const { Router } = express
const { findUserByUsername, checkPassword, updateUserCredentials, addNewUser } = require('../database/db')
const { AppError, catchErrorAsync } = require('../utils/errors')
const { authenticateUserCredentials, validateUser } = require('../services/AuthService')

const route = Router()

// auth routers will process json requests and send json responses
route.use(express.json())

route.post('/login', catchErrorAsync(async ( req, res) => {
    // if user already logged in then redirect to welcome page
    if (req.session.token) {
        return res.redirect('/welcome')
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
    req.session.token = user.username

    // redirect to welcome page
    res.status(200).json({ message: 'successfully logged in'})
    
}))

route.get('/welcome', validateUser, catchErrorAsync(async (req, res) => {
    // i am here means user logged in and validated successfully
    const { token: username } = req.session

    // if logged in say welcome < username >
    res.status(200).json({ message: `Welcome ${username}`})
}))

route.get('/logout', catchErrorAsync(async (req, res) => {
    const { token } = req.session

    // if token not exists then user is not logged in
    if (!token) {
        return res.status(200).json({ message: 'no active session; but user logged out successfully'})
    }

    req.session.destroy((err) => {
        if(err) {
            console.log(err)
            
            return res.status(500).json({ message: 'internal server error'})
        }

        res.status(200).json({ message: 'user logged out successfully'})
    })
}))

route.post('/register',  catchErrorAsync(async (req, res) => {
    const { body, session } = req

    // if user is loggedin and trying to register then it's a  bad request
    if (session.token) {
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

    // all inputs are validated, save the user and set the token to current session
    const newUser = addNewUser({ username, password })
    session.token = newUser.username

    res.status(200).json({ message: 'user registered' })
}))

module.exports = { authRoutes: route }