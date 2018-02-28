var express = require('express')
var routes = require('./routes');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');

mongoose.connect(
  'mongodb://microblog-admin:' +
  process.env.MONGO_ATLAS_PW +
  '@node-rest-shop-shard-00-00-k8xa3.mongodb.net:27017,node-rest-shop-shard-00-01-k8xa3.mongodb.net:27017,node-rest-shop-shard-00-02-k8xa3.mongodb.net:27017/test?ssl=true&replicaSet=node-rest-shop-shard-0&authSource=admin'
);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "key",
  saveUninitialized: true,
  resave: false
}));

app.use(flash());

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

routes(app);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
