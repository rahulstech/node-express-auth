const express = require('express')
const { Router } = express
const { findUserByUsername, checkPassword } = require('../database/db')

const route = Router()

function authenticateUserCredentials({ username, password }) {

    // find user by username
    const user = findUserByUsername(username)

    // if not found then throw no user for username
    if (!user) {
        throw new Error('username not found')
    }

    // if found next check password, if does not match then throw
    if (!checkPassword(user, password)) {
        throw new Error('incorrect password')
    }

    // all credentials matched, return the user
    return user
}

function validateUser(req, res, next) {
    // get the token from session
    const { token } = req.session

    // if token does not exists, means user not logged in
    if (!token) {
        return res.status(401).json({ message: 'not logged in' })
    }

    // token is the username, find user by username
    const user = findUserByUsername(token)

    // bad token, don't allow to proceed to secured resource
    if (!user) {
        return res.status(401).json({ message: 'invalid token, login again'})   
    }

    // user successfully validate, now i can proceed
    next()
}

// auth routers will process json requests and send json responses
route.use(express.json())

route.post('/login', ( req, res) => {
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

    try {
        const user = authenticateUserCredentials({ username, password })

        // add token in session
        req.session.token = user.username

        // redirect to welcome page
        res.status(200).json({ message: 'successfully logged in'})
    }
    catch(err) {
        return res.status(401).json({ message: err.message})
    }
})

route.get('/welcome', validateUser, (req, res) => {
    // i am here means user logged in and validated successfully
    const { token: username } = req.session

    // if logged in say welcome < username >
    res.status(200).json({ message: `Welcome ${username}`})
})

route.get('/logout', (req, res) => {
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
})

module.exports = { authRoutes: route }