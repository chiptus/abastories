const winston = require('winston');
const { format } = winston;

const unhandledFilesLogger = winston.createLogger({
  level: 'info',
  format: format.printf(
    ({ message, timestamp }) => `${timestamp} - ${message}`
  ),
  transports: [
    new winston.transports.File({ filename: 'unhandled_files.log' }),
  ],
});

const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
  format: format.simple(),
  transports: [
    new winston.transports.File({ filename: 'log.log' }),
    new winston.transports.Console(),
  ],
});

module.exports = {
  unhandledFilesLogger,
  logger,
};
