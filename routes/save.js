const express = require('express'),
      config = require('../config');

function isNumber(value) {
    return !isNaN(value - 0) && value !== null
        && value !== '' && value !== false;
}

function validateName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }
    
    if (name.length === 0 || name.length > config.moose.nameLength) {
        return false;
    }

    return true;
}

function validateImage(image) {
    if (!Array.isArray(image)) {
        return false;
    }

    if (image.length !== config.moose.height) {
        return false;
    }

    let isBlank = true;

    for (let row of image) {
        if (!Array.isArray(row)) {
            return false;
        }

        if (row.length !== config.moose.width) {
            return false;
        }

        for (let pixel of row) {
            if (!isNumber(pixel)) {
                return false;
            }
            if (pixel < 0 || pixel > config.moose.colors.length) {
                return false;
            }
            if (pixel !== 0) {
                isBlank = false;
            }
        }
    }

    return !isBlank;
}

module.exports = (log, knex) => {
    let router = express.Router();

    router.post('/', (request, result) => {
        if (config.app.tos && !request.session.isVerified) {
            return result.json({
                error: 'unauthorized access'
            });
        }

        if (!validateName(request.body.name)) {
            return result.json({ error: 'invalid name' });
        }

        if (!validateImage(request.body.image)) {
            return result.json({ error: 'invalid image' });
        }

        // this needs to be fixed, checking the count asynchronously and then
        // saving based on that result, NO NO!
        knex.count('* as count')
            .from('meese')
            .where('name', request.body.name)
            .then(rows => {
                if (rows.length != 1) {
                    log.error('Error saving moose: rows affected != 1 when counting meese');
                    return result.json({ error: 'internal error' });
                }
                if (rows[0].count !== 0) {
                    return result.json({ error: 'name taken' });
                }

                knex.insert({
                    name: request.body.name,
                    image: JSON.stringify(request.body.image, null, 0),
                    created: Date.now(),
                    ip: request.connection.remoteAddress
                })
                .into('meese')
                .then(rows => {
                    if (rows.length === 0) {
                        log.error('Error saving moose: rows affected == 0 when saving moose');
                        return result.json({ error: 'internal error' });
                    }

                    knex.insert({
                            moose_id: rows[0],
                            views: 0
                        })
                        .into('views')
                        .then(rows => {
                            if (rows.length === 0) {
                                log.error('Error saving moose: rows affected == 0 when saving moose views');
                                return result.json({ error: 'internal error' });
                            }

                            result.json({ success: true });
                        })
                        .catch(error => {
                            log.error('Error saving moose: ' + JSON.stringify(error));
                            result.json({ error: 'internal error' });
                        });                    
                })
                .catch(error => {
                    log.error('Error saving moose: ' + JSON.stringify(error));
                    result.json({ error: 'internal error' });
                });
            })
            .catch(error => {
                log.error('Error saving moose: ' + JSON.stringify(error));
                result.json({ error: 'internal error' });
            });
    });

    return router;
};
