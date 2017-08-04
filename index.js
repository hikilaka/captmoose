const bodyParser = require('body-parser'),
      config = require('./config'),
      express = require('express'),
      session = require('express-session'),
      KnexSessionStore = require('connect-session-knex')(session),
      favicon = require('serve-favicon'),
      knex = require('knex')(config.knex),
      Log = require('log'),
      path = require('path');

let app = express();
let log = new Log('debug');

let sessionStore = new KnexSessionStore({
      knex: knex,
      tablename: 'sessions'
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session middleware
if (config.app.tos) {
      console.log('using tos');
      app.use(session({
            store: sessionStore,
            secret: 'captmoose ahoyyy',
            cookie: {
                  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
            }
      }));
} else {
      console.log('tos disabled');
}

// front end
app.use('/', require('./routes/index')(log, knex));
app.use('/edit', require('./routes/edit')(log, knex));
app.use('/gallery', require('./routes/gallery')(log, knex));
app.use('/verify', require('./routes/verify')(log, knex));

// api
app.use('/view', require('./routes/view')(log, knex));
app.use('/save', require('./routes/save')(log, knex));

// must be last, default page handler (404)
app.get('*', (request, result) => result.redirect('/edit/404'));

app.listen(8080, () => console.log('captmoose now running'));
