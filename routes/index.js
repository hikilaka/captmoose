const express = require('express'),
      config = require('../config');

module.exports = (log, knex) => {
    let router = express.Router();

    router.get('/', (request, result) => {
        if (config.app.tos && !request.session.isVerified) {
            request.session.originatingUrl = request.originalUrl;
            result.redirect('/verify');
            return;
        }

        result.render('index', {
            title: 'Captain Moose',
            active: 'Home'
        });
    });

    return router;
};
