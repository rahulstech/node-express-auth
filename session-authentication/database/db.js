const { readFile, writeFile, constants } = require('node:fs/promises')
const path = require('node:path')
const { AppError } = require('../utils/errors')

const basePath = path.resolve(__dirname)
const USERS_JSON = path.join(basePath, 'users.json')

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
        await __writeFileAsync(USERS_JSON, users)
    }
    catch(err) {
        console.log(err)
    }
}


let users = {};

async function connectDatabase() {
    users = await __readFileAsync(USERS_JSON)
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

async function addNewUser({ username, password}) {
    const newUser = { username, password }

    users[username] = newUser

    console.log('a new user added')

    return newUser
}

module.exports = { 
    connectDatabase, closeDatabase,
    findUserByUsername, updateUserCredentials, addNewUser
}