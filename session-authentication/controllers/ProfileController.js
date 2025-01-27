const { updateUserCredentials } = require("../database/db")
const { addSessionTokenForUser, checkPassword } = require("../services/AuthService")
const { AppError } = require("../utils/errors")

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 */
async function welcome( req, res ) {
    // i am here means user logged in and validated successfully
    const { user } = req

    // if logged in say welcome < username >
    res.status(200).json({ message: `Welcome ${user.username}`})
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
async function changeCredentials( req, res, next) {
    const { user, session, body } = req

    // only a logged in user can update credentials
    // get the new values of the credentials. any update in credential requires current password
    // it is not necessary  to update all credentials everytime

    const { newUsername, newPassword, currentPassword } = body || {}
    
    // there is nothing to update then, it is a bad request
    if (!newUsername && !newPassword) {
        throw new AppError(400, 'nothing to update')
    }

    // check current password before updating any credentials, if not found then bad request
    if (!currentPassword) {
        throw new AppError(400, 'current password required for upating any credentials')
    }

    // if current password does not match the it's unauthorized
    if (! await checkPassword(user, currentPassword)) {
        throw new AppError(401, 'password does match; can not update credentials')
    }

    // now i can update the credentials
    const updatedUser = await updateUserCredentials(user, { newUsername, newPassword })

    // i need to update the session also
    session.regenerate(err => {

        // error occurred in regenerating the session
        if (err) {
            console.log(err)
            next(new AppError(500, 'can not create session'))
            return
        }

        // new session generated succesfully, new add the updated token
        addSessionTokenForUser(req.session, updatedUser)

        res.json({ message: 'credentials updated sucessfully'})
    })
}

module.exports = { welcome, changeCredentials }