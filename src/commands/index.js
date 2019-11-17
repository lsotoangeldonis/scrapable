const program = require('commander')

program

  .command('db:sync')
  .description('sync scraped products data to database')
  .action(function() {
    require('./db/sync')
  })

const runCommand = (alias, args = []) => {
  program._events[`command:${alias}`]([], args)
}

module.exports = {
  program,
  runCommand,
}
