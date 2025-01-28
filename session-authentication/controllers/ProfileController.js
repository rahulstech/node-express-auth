const { updateUserCredentials, findUserByUsername, findUserByUserId } = require("../database/db")
const { canUpdate } = require("../services/AuthorizationService")
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

async function updateOwnCredentials(user, req, res, next) {
    const { newUsername, newPassword, currentPassword } = req.body

    if (!currentPassword) {
        throw new AppError(400, 'current password required for upating credentials')
    }

    // if current password does not match the it's unauthorized
    if (! await checkPassword(user, currentPassword)) {
        throw new AppError(401, 'password does match; can not update credentials')
    }

    // now i can update the credentials
    const updatedUser = await updateUserCredentials(user, { newUsername, newPassword })

    // i need to update the session also
    req.session.regenerate(err => {

        // error occurred in regenerating the session
        if (err) {
            next(new AppError(500, 'can not create session', true, err.stack))
            return
        }

        // new session generated succesfully, new add the updated token
        addSessionTokenForUser(req.session, updatedUser)

        res.json({ message: 'credentials updated sucessfully'})
    })
}

async function updateOthersCredentials(user, userId, req, res) {

    const { newUsername, newPassword } = req.body

    // since the user is not updating it's own credentials, get the target user by user id
    const targetUser = findUserByUserId(userId)
    if (!targetUser) {
        throw new AppError(404, `no user found with id ${userId}`)
    }

    // and check that weather current user is permitted to update credentials of the target user
    if (!canUpdate(user.role, 'users', targetUser.role)) {
        throw new AppError(401, 'you can not update credentials of another user')
    }

    // now i can update the credentials
    await updateUserCredentials(targetUser, { newUsername, newPassword })

    res.json({ message: `credentials for user ${userId} updated sucessfully`})
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
async function changeCredentials( req, res, next) {
    const { user, body } = req
    const { userId } = req.params || {}

    const _userId = parseInt(userId || '0', 10)

    // only a logged in user can update credentials
    // get the new values of the credentials. any update in credential requires current password
    // it is not necessary  to update all credentials everytime
    const { newUsername, newPassword } = body || {}
    
    // there is nothing to update then, it is a bad request
    if (!newUsername && !newPassword) {
        throw new AppError(400, 'nothing to update')
    }

    // if user is updating his own credentials then current passsword is required
    // to ensure that user is updating own credentals i can check userId parameter and logged in user id are same

    if (_userId === user.id) {
        updateOwnCredentials(user, req, res, next)
    }
    else {
        updateOthersCredentials(user, _userId, req, res)
    }
}

module.exports = { welcome, changeCredentials }