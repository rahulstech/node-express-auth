const express = require('express')
const session = require('express-session')
const { authRoutes } = require('./routes/auth')
const { profileRoutes } = require('./routes/profile')
const { connectDatabase, closeDatabase } = require('./database/db')
const { AppError } = require('./utils/errors')

process.on('SIGINT', () => {
    console.log('process intrupted')
    closeDatabase()
    .then(() => {
        process.exit(1)
    })
})

process.on('beforeExit', async (code) => {
    await closeDatabase()
}) 

const server = express()

// must set the session middleware before any "endpoint"
server.use(session({
    secret: process.env.SESSION_SECRET, // used to encrypt session data, should be supplied from .env file
    saveUninitialized: true,
    resave: true // this field is required
}))

// Add Routes

server.use(authRoutes)

server.use(profileRoutes)

// Add Error Handler

server.use((err, req, res, next) => {
    let operational = false
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message })
        operational = err.operational
    }
    else {
        console.log(err)
        res.status(500).json({ message: 'internal server error'})
    }

    if (!operational) {
        process.exit(1)
    }
})

// Connect to database and start listening

connectDatabase()
.then( () => {
    console.log('database connected successfully')

    server.listen(3000, () => console.log('server is running at port 3000'))
})
.catch(err => {
    console.log(err)
})
