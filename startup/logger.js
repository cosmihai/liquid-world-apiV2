const { createLogger, transports, format } = require('winston');
require('winston-mongodb');
const config = require('config');


const logger = createLogger({
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(format.timestamp(), format.simple()),
        }),
        new transports.File({
            filename: 'info.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.prettyPrint()),
        }),
        new transports.MongoDB({
            level: 'error',
            options: {useUnifiedTopology: true},
            storeHost: true,
            db: config.get('db'),
            collection: 'errors.log',
            capped:true,    
            size: 5242880,
        }),
    ]
})

module.exports = logger;