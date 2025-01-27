const { validateUser } = require('../services/AuthService')
const { catchErrorAsync } = require('../utils/errors')
const { changeCredentials, welcome } = require('../controllers/ProfileController')
const { Router } = require('express')

const routes = Router()

routes.get('/', catchErrorAsync(welcome))

routes.put('/credentials', catchErrorAsync(changeCredentials))

const profileRoutes = Router()

profileRoutes.use('/profile', catchErrorAsync(validateUser), routes)

module.exports = { profileRoutes }



