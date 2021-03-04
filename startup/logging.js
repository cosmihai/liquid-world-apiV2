const winston = require('winston');
require('express-async-errors');

module.exports = function() {
  //handle uncaught exceptions from outside of express context
  // process.on('uncaughtException', ex => {
  //   winston.error(ex.message, ex);
  //   process.exit(1);
  // });

  //catch unhandled promise rejection from outside of express context
  // process.on('unhandledRejection', ex => {
  //   winston.error(ex.message, ex);
  //   process.exit(1);
  // });

  //same as above but with winston
  winston.handleExceptions(
    new winston.transports.Console({ colorize: true, prettyPrint: true }),
    new winston.transports.File({ filename: 'uncaughtExceptions.log' })
  );
  //because winston can not handle promise rejection we transform the rejection into exception
  process.on('unhandledRejection', ex => {
    throw ex;
  });
  //log errors from inside express context
  winston.add(winston.transports.File, { filename: 'logfile.log' });
}