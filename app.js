let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

const indexRouter = require('./routes/index');
const personRouter = require('./routes/person');
const locationRouter = require('./routes/location');
const companyRouter = require('./routes/company');
const noteRouter = require('./routes/note');
const fileRouter = require('./routes/file');
const searchRouter = require('./routes/search');
const dateRouter = require('./routes/date');
const contactRouter = require('./routes/contact');
const activityRouter = require('./routes/activity');

let app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', personRouter);
app.use('/', locationRouter);
app.use('/', noteRouter);
app.use('/', fileRouter);
app.use('/', dateRouter);
app.use('/', contactRouter);
app.use('/', activityRouter);
app.use('/company', companyRouter);
app.use('/search', searchRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
