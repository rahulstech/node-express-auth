const { getRoles, getPermission } = require('../database/db')
const { AppError } = require('../utils/errors')

const roles = getRoles()

function compareRoles( myRole, targetRole ) {
    const myPriority = roles[myRole]
    const targetPriority = roles[targetRole]

    if (!myPriority) {
        throw new AppError(500, `unknow my role ${myRole}`)
    }
    if (!targetPriority) {
        throw new AppError(500, `unknown target role ${targetRole}`)
    }

    if (myPriority < targetPriority) {
        return 1
    }
    else if (myPriority > targetPriority) {
        return -1
    }
    else {
        return 0
    }
}

function isPermitted( myRole, targetRole, previleges ) {

    if (previleges.includes('none')) {
        return false
    }

    if (previleges.includes('all')) {
        return true
    }

    const comparison = compareRoles(myRole, targetRole)

    if (comparison < 0) {
        return previleges.includes('below')
    }
    else if (comparison == 0) {
        return previleges.includes('self') 
    }
    else {
        return false
    }
}

function canDo(operation, resource, myRole, targetRole) {
    const previleges = getPermission(myRole, resource, operation)

    return isPermitted(myRole, targetRole, previleges)
}

function canCreate( myRole, resource, targetRole ) {
    return canDo('can_create', resource, myRole, targetRole)
}

function canRead( myRole, resource, targetRole ) {
    return canDo('can_read', resource, myRole, targetRole)
}

function canUpdate( myRole, resource, targetRole ) {
    return canDo('can_update', resource, myRole, targetRole)
}

function canDelete( myRole, resource, targetRole ) {
    return canDo('can_delete', resource, myRole, targetRole)
}

module.exports = {
    canCreate, canRead, canUpdate, canDelete,
}