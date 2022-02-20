const { transports, format } = require('winston');
const logger = require("../startup/logger");
require('winston-mongodb');
require('express-async-errors');
const config = require('config');

module.exports = function() {
    logger.exceptions.handle(
        new transports.File({ filename: 'exceptions.log' })
    );
    logger.exceptions.handle(
        new transports.MongoDB({
            level: 'error',
            options: {useUnifiedTopology: true},
            storeHost: true,
            db: config.get('db'),
            collection: 'uncaughtExceptions.log',
            format: format.combine(format.timestamp(), format.prettyPrint()),
            capped:true,
            size: 5242880
        })
    )
}
