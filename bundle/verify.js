const xhr = require('xhr');

function onVerified() {
    let response = grecaptcha.getResponse();

    if (response.length === 0) {
        return;
    }

    let options = {
        body: {
            response: response
        },
        json: true
    };

    xhr.post('/verify', options, (error, response, body) => {
        if (error) {
            return alert('Error verifying: ' + error);
        }

        if (response.statusCode !== 200) {
            return alert('Bad status: ' + response.statusCode);
        }

        try {
            let parsed = body;

            if (parsed.originatingUrl) {
                window.location = parsed.originatingUrl;
            }
        } catch (ex) {
            alert('Error parsing verification JSON: ' + ex);
        }
    });
}

function start() {
    window.onRecaptchaVerified = onVerified;
}

if (window.attachEvent) {
    window.attachEvent('onload', start);
} else {
    if (window.onload) {
        let onload = window.onload;

        window.onload = (event) => {
            onload(event);
            start();
        };
    } else {
        window.onload = start;
    }
}
