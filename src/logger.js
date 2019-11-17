const { createLogger, format, transports } = require('winston')
require('winston-daily-rotate-file')
const fs = require('fs')
const path = require('path')

const env = process.env.NODE_ENV || 'development'
const logsPath = path.join(process.cwd(), process.env.LOGS_PATH)
const fileExt = 'log'

// Create the log directory if it does not exist
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath)
}

const print = format.printf(info => {
  if (info.message.constructor === Object) {
    info.message = JSON.stringify(info.message, null, 4)
  }
  const log = `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`

  return info.stack ? `${log}\n${info.stack}` : log
})

const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.errors({ stack: true }),
    format.label({ label: path.basename(process.mainModule.filename) }),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    print
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.prettyPrint(), print),
    }),
    new transports.DailyRotateFile({
      filename: `${logsPath}/%DATE%-global.${fileExt}`,
      datePattern: 'YYYY-MM-DD',
      level: 'silly',
    }),
    new transports.DailyRotateFile({
      filename: `${logsPath}/%DATE%-error.${fileExt}`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
    }),
  ],
})

module.exports = logger
