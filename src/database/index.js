const database = require(`./drivers/${process.env.DB_DRIVER}`)

module.exports = database
