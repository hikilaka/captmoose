const express = require('express'),
      config = require('../config'),
      https = require('https');

module.exports = (log, knex) => {
    let router = express.Router();

    router.post('/', (request, result) => {
        if (!config.app.tos) {
            return result.redirect('/');
        }

        if (request.session.isVerified) {
            // should be unreachable
            log.info('control reached unlikely execution. possible expoit attempt. session already verified');
            return;
        }

        if (!request.body.response) {
            // should be unreachable
            log.info('control reached unlikely execution. possible expoit attempt. no reponse in verification');
            return;
        }

        let options = {
            host: 'www.google.com',
            path: '/recaptcha/api/siteverify?secret=' + encodeURIComponent(config.recaptcha.private) + '&response=' + encodeURIComponent(request.body.response)
        };

        https.get(options, response => {
            let data = '';
            response.on('data', chunk => data += chunk);

            response.on('end', () => {
                try {
                    let parsed = JSON.parse(data);

                    if (parsed.success) {
                        request.session.isVerified = true;

                        if (request.session.originatingUrl) {
                            result.json({
                                originatingUrl: request.session.originatingUrl
                            });
                        } else {
                            result.json({
                                originatingUrl: '/'
                            });
                        }
                    }
                } catch (ex) {
                    log.error('error parsing JSON from google recaptcha: ' + ex);
                }
            });

            response.on('error', error => log.error('error contacting google recaptcha service: ' + error));
        });
    });

    router.get('/', (request, result) => {
        if (!config.app.tos) {
            return result.redirect('/');
        }

        result.render('verify', {
            title: 'Captain Moose',
            active: 'Verify',
            recaptchaPublicKey: config.recaptcha.public,
            isVerified: request.session.isVerified,
            baseUrl: request.baseUrl
        });
    });

    return router;
};
