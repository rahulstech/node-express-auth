const { readFile, writeFile, constants } = require('node:fs/promises')
const path = require('node:path')
const { AppError } = require('../utils/errors')

const basePath = path.resolve(__dirname)

const USERS_JSON = path.join(basePath, 'users.json')

const PERMISSIONS_JSON = path.join(basePath, 'roles_and_permissions.json')

async function __readFileAsync(filepath) {
    const content = await readFile(filepath, { encoding: 'utf-8', flag:  constants.O_CREAT | constants.O_RDONLY })
    return content ? JSON.parse(content) : {}
}

function __writeFileAsync(filepath, content) {
    const data = JSON.stringify(content,null,2)

    return writeFile(filepath, data, { encoding: 'utf-8', flag:  constants.O_CREAT | constants.O_WRONLY })
}

async function closeDatabase() {
    console.log('closing database')

    try {
        await __writeFileAsync(USERS_JSON, getUsersData())

    }
    catch(err) {
        console.log(err)
    }
}

async function connectDatabase() {
    const usersData = await __readFileAsync(USERS_JSON)
    setUsersData(usersData)

    const permissionsData = await __readFileAsync(PERMISSIONS_JSON)
    setPermissionsData(permissionsData)
}


let users = {}
let usersSequence = 0

let permissions = {}

let roles = {}

function setUsersData(data) {
    users = data.users
    usersSequence = data.sequence
}

function getUsersData() {
    return { 
        sequence: usersSequence,
        users
    }
}

function setPermissionsData(data) {
    roles = data.roles
    permissions = data.permissions
}

function findUserByUsername( username ) {
    const entry = Object.entries(users).find(([_username, _user]) => {
        return _username === username;
    })

    if (entry) {
        const user = entry[1]
        return user
    }
    
    return null
}

function findUserByUserId( id ) {
    const entry = Object.entries(users).find(([_username, _user]) => {
        return _user.id === id;
    })

    if (entry) {
        const user = entry[1]
        return user
    }
    
    return null
}

async function updateUserCredentials(user, { newUsername, newPassword }) {

    const userCopy = { ...user }
    const oldUsername = user.username

    if (newUsername) {
        const existingUser = findUserByUsername(newUsername)
        if (existingUser) {
            throw new AppError(409, `another user with username ${newUsername} already exists`)
        }
        userCopy.username = newUsername
    }

    if (newPassword) {
        userCopy.password = newPassword
    }

    delete users[oldUsername]

    users[userCopy.username] = userCopy

    console.log('user credentials updated successfully')

    return userCopy
}

async function addNewUser({ username, password, role }) {
    
    const id = ++usersSequence

    const newUser = { id, username, password, role }

    users[username] = newUser

    console.log('a new user added')

    return newUser
}

function getRoles() {
    return roles
}

/**
 * Returns the previleges for the specified role, resource and operation. For example: if an admin want to create new user
 * then role = admin, resource = users and operation = can_create. if any permission found for that perticular combination
 * then it will return an array of string containing one or more previleges. previleges are all, same, low, self, none.
 * self: operation allowed iff resource belongs that user
 * low: operation allowed for user with lower roles only. for example user role is lower than admin role
 * same: operation allowed for users with same role only, but not for self
 * all: short form of self, low and same. 
 * none: operation is not allowed
 * 
 * @param {string} role 
 * @param {string} resource 
 * @param {string} operation 
 * @returns { string[] | null }
 */
function getPermission( role, resource, operation ) {

    // role > operation > resource
    const operations = permissions[role]
    if (operations) {
        const resources = operations[operation]
        if (resources) {
            const previleges = resources[resource]
            if (previleges) {
                return previleges
            }
        }
    }
    return null
}

module.exports = { 
    connectDatabase, closeDatabase,
    findUserByUsername, updateUserCredentials, addNewUser, findUserByUserId,
    getPermission, getRoles,
}