const config = require('./config'),
      xhr = require('xhr');

module.exports.get = name => {
    return new Promise((resolve, reject) => {
        let options = {
            json: true
        };

        xhr.get('/view/' + encodeURIComponent(name), options, (error, response, body) => {
            if (error) {
                return reject(error);
            }

            if (response.statusCode !== 200) {
                return reject(Error('Bad status: ' + response.statusCode));
            }

            try {
                if (body.image) {
                    body.image = JSON.parse(body.image);
                }
                resolve(body);
            } catch (error) {
                reject(error);
            }
        });
    });
};

module.exports.save = (name, image) => {
    let options = {
        body: {
            name: name,
            image: image
        },
        json: true
    };

    return new Promise((resolve, reject) => {
        xhr.post('/save/', options, (error, response, body) => {
            if (error) {
                return reject(error);
            }

            if (response.statusCode !== 200) {
                return reject(Error('Bad status: ' + response.statusCode));
            }

            try {
                resolve(body);
            } catch (error) {
                reject(error);
            }
        });
    });
};
