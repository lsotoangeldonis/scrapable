const PouchDB = require('pouchdb')

const makeDb = config => {
  return new PouchDB(config)
}

module.exports = {
  makeDb,
}
