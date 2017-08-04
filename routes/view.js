const express = require('express'),
      config = require('../config');

module.exports = (log, knex) => {
    let router = express.Router();

    router.get('/random/:accesskey?', (request, result) => {
        request.params.accesskey = request.params.accesskey || '';

        if (config.app.tos) {
            if (!request.session.isVerified && request.params.accesskey !== 'captmoose ahoyyy') {
                return result.json({
                    error: 'unauthorized access'
                });
            }
        }

        knex.select().from(knex.raw('`meese`, `views`'))
            .whereRaw('meese.id = moose_id')
            .groupBy('moose_id')
            .orderByRaw('RAND()')
            .limit(1)
            .then(rows => {
                if (rows.length === 0) {
                    result.json({ error: 'moose not found' });
                } else {
                    result.json({
                        id: rows[0].id,
                        name: rows[0].name,
                        image: rows[0].image,
                        created: rows[0].created,
                        views: rows[0].views + 1
                    });

                    knex('views').update({
                        views: rows[0].views + 1
                    })
                    .where('moose_id', '=', rows[0].id)
                    .then(rows => {
                        if (rows !== 1) {
                            log.error('Error updating view count: rows affected != 1');
                        }
                    })
                    .catch(error => log.error('Error updating view count: ' + JSON.stringify(error)));
                }
            })
            .catch(error => {
                log.error('Error fetching random moose: ' + JSON.stringify(error));
                result.json({ error: 'internal error' });
            });
    });

    router.get('/latest/:accesskey?', (request, result) => {
        request.params.accesskey = request.params.accesskey || '';

        if (config.app.tos) {
            if (!request.session.isVerified && request.params.accesskey !== 'captmoose ahoyyy') {
                return result.json({
                    error: 'unauthorized access'
                });
            }
        }

        knex.select().from(knex.raw('`meese`, `views`'))
            .whereRaw('meese.id = moose_id')
            .groupBy('moose_id')
            .orderBy('id', 'desc')
            .limit(1)
            .then(rows => {
                if (rows.length === 0) {
                    result.json({ error: 'moose not found' });
                } else {
                    result.json({
                        id: rows[0].id,
                        name: rows[0].name,
                        image: rows[0].image,
                        created: rows[0].created,
                        views: rows[0].views + 1
                    });

                    knex('views').update({
                        views: rows[0].views + 1
                    })
                    .where('moose_id', '=', rows[0].id)
                    .then(rows => {
                        if (rows !== 1) {
                            log.error('Error updating view count: rows affected != 1');
                        }
                    })
                    .catch(error => log.error('Error updating view count: ' + JSON.stringify(error)));
                }
            })
            .catch(error => {
                log.error('Error fetching latest moose: ' + JSON.stringify(error));
                result.json({ error: 'internal error' });
            });
    });

    router.get('/:moose/:accesskey?', (request, result) => {
        request.params.moose = request.params.moose || '';
        request.params.accesskey = request.params.accesskey || '';

        if (config.app.tos) {
            if (!request.session.isVerified && request.params.moose !== '404'
                && request.params.accesskey !== 'captmoose ahoyyy') {
                return result.json({
                    error: 'unauthorized access'
                });
            }
        }

        knex.select().from(knex.raw('`meese`, `views`'))
            .whereRaw('meese.id = moose_id')
            .groupBy('moose_id')
            .whereRaw('BINARY `name` = ?', [request.params.moose])
            .limit(1)
            .then(rows => {
                if (rows.length === 0) {
                    result.json({ error: 'moose not found' });
                } else {
                    result.json({
                        id: rows[0].id,
                        name: rows[0].name,
                        image: rows[0].image,
                        created: rows[0].created,
                        views: rows[0].views + 1
                    });

                    knex('views').update({
                        views: rows[0].views + 1
                    })
                    .where('moose_id', '=', rows[0].id)
                    .then(rows => {
                        if (rows !== 1) {
                            log.error('Error updating view count: rows affected != 1');
                        }
                    })
                    .catch(error => log.error('Error updating view count: ' + JSON.stringify(error)));
                }
            })
            .catch(error => {
                log.error('Error fetching moose: ' + JSON.stringify(error));
                result.json({ error: 'internal error' });
            });
    });

    return router;
};
