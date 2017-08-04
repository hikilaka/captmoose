const express = require('express'),
      config = require('../config');

module.exports = (log, knex) => {
    let router = express.Router();

    router.get('/:moose?', (request, result) => {
        if (config.app.tos && !request.session.isVerified && request.params.moose !== '404') {
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
