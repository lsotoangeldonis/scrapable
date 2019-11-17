const util = require('util')
const mysql = require('mysql')
const logger = require(`${process.cwd()}/bootstrap`).logger

const makeDb = cfg => {
  const config = cfg || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  }

  const connection = mysql.createConnection(config)
  let lastSql = null

  return {
    query(sql, args) {
      lastSql = { sql, args }
      return util.promisify(connection.query).call(connection, sql, args)
    },
    beginTransaction() {
      return util.promisify(connection.beginTransaction).call(connection)
    },
    commit() {
      return util.promisify(connection.commit).call(connection)
    },
    rollback() {
      return util.promisify(connection.rollback).call(connection)
    },
    close() {
      return util.promisify(connection.end).call(connection)
    },
    lastQuery() {
      return lastSql
    },
  }
}

const withTransaction = async (db, callback) => {
  try {
    await db.beginTransaction()
    await callback()
    await db.commit()
  } catch (err) {
    await db.rollback()
    console.log(db.lastQuery())
    throw err
  } finally {
    await db.close()
  }
}

module.exports = {
  makeDb,
  withTransaction,
}
