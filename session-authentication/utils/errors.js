const status = require('http-status')

class AppError extends Error {

    constructor(statusCode, message = '', operational = true, stack = '') {
        super()
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.message = message || status[statusCode]
        this.operational = operational
        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

function catchErrorAsync(fn) {
    return ( req, res, next) => {
        fn(req, res, next)
        .catch(err => next(err))
    }
}

module.exports = { 
    AppError, catchErrorAsync
}