const express = require('express')
const session = require('express-session')

const server = express()

// must set the session middleware before any "endpoint"
server.use(session({
    secret: 'mysecret', // used to encrypt session data, should be supplied from .env file
    saveUninitialized: true,
    resave: true // this field is required
}))

server.get('/', (req, res) => {

    const { sessionID, session } = req

    // i can access the sessionID and the session object from the request
    console.log(sessionID)
    console.log(session)

    // only when there is some session data added
    // then the session is remembers for the client.
    // for example: i added a value visit to session. 
    // it counts number of times a client sends request to this endpoint
    // all successive requests from the same client will use this session
    // untill the session expires.
    //
    // proof that server is using different session for different clients, i can
    // open a browser and postman, send request to this endpoint and refresh multiple time
    // then check that the visit values are different
    if (session.visit) {
        session.visit += 1
    }
    else {
        session.visit = 1
    }

    res.json({ visit: session.visit })
})

server.listen(3000, () => console.log('server is running at port 3000'))