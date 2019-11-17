require('./bootstrap')

const { description, version } = require('../package.json')
const { program } = require(`${__dirname}/commands`)
const logger = require('./logger')

try {
  program
    .version(version)
    .description(description)

    .option('-d, --debug', 'output extra debugging')

    .on('command:*', function(command) {
      const firstCommand = command[0]
      if (!this.commands.find(c => c._name === firstCommand)) {
        logger.error(
          `Invalid command: ${firstCommand}\nSee --help for a list of available commands.`
        )
        process.exit(1)
      }
    })

    .parse(process.argv)

  if (program.debug) logger.debug(program.opts())
  else if (!program.args.length) program.help()
} catch (error) {
  logger.error(error)
  //logger.error(error)
}
