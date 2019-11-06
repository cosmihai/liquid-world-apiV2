require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const config = require('config');
const express = require('express');
const app = express();
require('./startup/routes')(app);
require('./startup/db')();


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
  new winston.transports.File({ filename: 'uncaughtExceptions.log' })
);
//because winston can not handle promise rejection we transform the rejection into exception
process.on('unhandledRejection', ex => {
  throw ex;
});
//log errors from inside express context
winston.add(winston.transports.File, { filename: 'logfile.log' });
winston.add(winston.transports.MongoDB, { db: 'mongodb://localhost/LWApi'});

const port = process.env.PORT || 3000;
if(!config.get('jwtKey')) {
  console.error('FATAL ERROR: jwtKey is not defined.');
  process.exit(1);
}
console.log(`App: ${config.get("appName")}\nEnv: ${app.get("env")}`);

app.listen(port, console.log(`app started on port ${port} ..`))
