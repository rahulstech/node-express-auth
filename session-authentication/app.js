const express = require('express')
const session = require('express-session')

const { authRoutes } = require('./routes/auth')

const server = express()

// must set the session middleware before any "endpoint"
server.use(session({
    secret: 'mysecret', // used to encrypt session data, should be supplied from .env file
    saveUninitialized: true,
    resave: true // this field is required
}))

server.use(authRoutes)

server.listen(3000, () => console.log('server is running at port 3000'))