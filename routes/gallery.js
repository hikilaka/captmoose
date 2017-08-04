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

        result.render('gallery', {
            title: 'Captain Moose - Gallery',
            active: 'Gallery'
        });
    });

    router.get('/view/:page/:sort/:search?', (request, result) => {
        if (config.app.tos && !request.session.isVerified) {
            return result.json({
                error: 'unathorized access'
            });
        }

        request.params.page = +request.params.page || 0;
        request.params.sort = +request.params.sort || 0;
        request.params.search = request.params.search || '';
        request.params.search = request.params.search.trim();

        if (request.params.sort === 2) { // sort by views
            knex.select().from(knex.raw('`meese`, `views`'))
                .whereRaw('meese.id = moose_id')
                .groupBy('moose_id')
                .limit(6)
                .offset(request.params.page * 6)
                .orderBy('views', 'desc')
                .where('name', 'like', `%${request.params.search}%`)
                .then(rows => {
                    result.json(rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        image: row.image,
                        created: row.created,
                        views: row.views
                    })));
                })
                .catch(error => {
                    result.json({ error: 'internal error' });
                    log.error('Error retrieving gallery: ' + JSON.stringify(error));
                });
        } else { // sort by age
            knex.select().from(knex.raw('`meese`, `views`'))
                .whereRaw('meese.id = moose_id')
                .groupBy('moose_id')
                .limit(6)
                .offset(request.params.page * 6)
                .orderBy('id', request.params.sort === 0 ? 'desc' : 'asc')
                .where('name', 'like', `%${request.params.search}%`)
                .then(rows => {
                    result.json(rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        image: row.image,
                        created: row.created,
                        views: row.views
                    })));
                })
                .catch(error => {
                    result.json({ error: 'internal error' });
                    log.error('Error retrieving gallery: ' + JSON.stringify(error));
                });
        }
    });

    return router;
};
