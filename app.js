require('express-async-errors');
const error = require('./middlewares/error');
const morgan = require('morgan');
const config = require('config');
const authRoute = require('./routes/auth');
const bartendersRoute = require('./routes/bartenders');
const cocktailsRoute = require('./routes/cocktails');
const commentsRoute = require('./routes/comments');
const customersRoute = require('./routes/customers');
const restaurantsRoute = require('./routes/restaurants');
const likesRoute = require('./routes/likes');
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
console.log(`App: ${config.get("appName")}\nEnv: ${app.get("env")}`);

//middlewares
app.use(express.json())
if(app.get("env") === 'development') {
  app.use(morgan('tiny'));
  console.log('morgan enabled...')
};
app.use('/api/auth', authRoute);
app.use('/api/bartenders', bartendersRoute);
app.use('/api/cocktails', cocktailsRoute);
app.use('/api/comments', commentsRoute);
app.use('/api/customers', customersRoute);
app.use('/api/restaurants', restaurantsRoute);
app.use('/api/likes', likesRoute);
app.use('**', (req, res) => res.status(404).send('Inexistent resorce'));
app.use(error);


app.listen(port, console.log(`app started on port ${port} ..`))
