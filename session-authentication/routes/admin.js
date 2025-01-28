const { Router } = require('express')
const { validateUser } = require('../services/AuthService')
const { catchErrorAsync, AppError } = require('../utils/errors')
const { welcome } = require('../controllers/AdminController')
const { adminLogin, registerAdmin } = require('../controllers/AuthController')
const { changeCredentials } = require('../controllers/ProfileController')

async function checkLoggedInAsAdmin(req, res, next) {
    const { user } = req
    if (user.role !== 'admin' ) {
        throw new AppError(401,'only admins can access')
    }
    next()
}

const routes = Router()

routes.post('/login', catchErrorAsync(adminLogin))

routes.post('/register', catchErrorAsync(registerAdmin))

const middlewares = [ catchErrorAsync(validateUser), catchErrorAsync(checkLoggedInAsAdmin) ]

routes.get('/welcome', middlewares, catchErrorAsync(welcome))

routes.put('/profiles/:userId/credentials', middlewares, catchErrorAsync(changeCredentials))

const adminRoutes = Router()

adminRoutes.use('/admin', routes)

module.exports = { 
    adminRoutes
}