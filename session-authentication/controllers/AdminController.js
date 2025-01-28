const {  } = require("../services/AuthService")
const { AppError } = require("../utils/errors")

async function welcome(req, res) {
    const { user } = req
    res.json({ message: `hello admin ${user.username}`})
}

module.exports = {
     welcome,
}