const express = require('express')
const { Router } = express
const { catchErrorAsync } = require('../utils/errors')
const { login, logout, register } = require('../controllers/AuthController')

const route = Router()

// auth routers will process json requests and send json responses
route.use(express.json())

route.post('/login', catchErrorAsync(login))

route.get('/logout', catchErrorAsync(logout))

route.post('/register',  catchErrorAsync(register))

module.exports = { authRoutes: route }