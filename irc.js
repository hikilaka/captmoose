var http = require('http'),
    irc = require('irc'),
    c = require('irc-colors'),
    request = require('request-promise'),
    moment = require('moment');

var config = require('./config'),
    client = new irc.Client('irc.rizon.net', 'CaptMoose', {
        realName: 'CaptMoose',
        channels: ['#ghetty', '#trollhour']
    }),
    lastMessage = 0,
    url = 'http://captmoose.club';

function findMoose(name, done) {
    request({
        uri: url + '/view/' + encodeURIComponent(name) + '/' + encodeURIComponent('captmoose ahoyyy'),
        resolveWithFullResponse: true
    }).then(resp => {
        if (resp.statusCode !== 200) {
             return done();
        }
        try {
            let moose = JSON.parse(resp.body);
            if (moose.error) {
                return done(null, null);
            }
            moose.image = JSON.parse(moose.image).map(i => i.map(j => config.moose.colors[j]));
            done(null, moose);
        } catch (e) {
            done(e);
        }
    }).catch(err => done());
}

// remove the transparent padding around the moose
function shrinkMoose(moose) {
    var minX = moose[0].length,
        minY = moose.length, maxY = 0,
        i, j;

    for (i = 0; i < moose.length; i += 1) { // height
        for (j = 0; j < moose[0].length; j += 1) { // width
            if (moose[i][j] !== 'transparent') {
                if (i < minY) {
                    minY = i;
                } else if (i > maxY) {
                    maxY = i;
                }

                if (j < minX) {
                    minX = j;
                }
            }
        }
    }

    moose = moose.slice(minY, maxY + 1).map(function (row) {
        var lastColour = row.length,
            i;

        for (i = 0; i < row.length; i += 1) {
            if (row[i] !== 'transparent') {
                lastColour = i;
            }
        }

        return row.slice(minX, lastColour + 1);
    });

    return moose;
}

// turn the moost from a 2D list of colours to a 2D list of IRC colour codes
function formatMoose(moose) {
    return moose.map(function (row) {
        return row.map(function (colour) {
            if (colour === 'transparent') {
                return c.stripColors(' ');
            }

            return c[colour]['bg' + colour](' ');
        });
    });
}

// we don't want the moose to get kicked for spamming, so implement a short
// delay between two lines
function sayMoose(say, moose, done) {
    if (moose.length) {
        say(moose[0].join(''));

        if (moose[1]) {
            say(moose[1].join(''));
        }

        setTimeout(function () {
            sayMoose(say, moose.slice(2, moose.length), done);
        }, 800);
    } else {
        if (done) {
            return done();
        }
    }
}

client.addListener('message', function (from, to, message) {
        var mooseMe = message.match(/^\.?moose(?:me)? (.+)/),
            bots = /^\.bots/.test(message),
            remaining;

        if (!/#/.test(to) || !(mooseMe || bots)) {
            return;
        }

        remaining = Math.round((Date.now() - lastMessage) / 1000);

        if (remaining < 10) {
            client.notice(from, 'Please wait another ' + (10 - remaining) +
                                ' second' + (remaining < 9 ? 's' : ''));
            return;
        }

        if (bots) {
            client.say(to, 'CaptMoose [NodeJS], create moose pictures at ' + url);
            return;
        }

        mooseMe = mooseMe[1].trim();

        findMoose(mooseMe, function (err, moose) {
            var shrunk;

            if (err) {
                client.say(to, c.bold.red('Moose parsing error'));
                return console.error(err.stack);
            }

            if (!moose) {
                return client.say(to, c.bold.red('Moose not found.') + ' create him at ' + url);
            }

            lastMessage = Date.now();
            shrunk = formatMoose(shrinkMoose(moose.image));

            sayMoose(client.say.bind(client, to), shrunk, function () {
                let message = '[' + c.bold(moose.views + ' view' + (moose.views === 1 ? '' : 's')) + ', ' + c.bold('created ' + moment(new Date(moose.created)).fromNow()) + ']';    
                if (mooseMe === 'random' || mooseMe === 'latest') {
                    message = 'A lovely ' + c.bold(moose.name) + ' moose. ' + message;
                }
                client.say(to, message);
            });
        });
});

client.addListener('registered', function() {
//    client.say('nickserv', 'identify ');
})

client.addListener('error', function (err) {
    console.error(err.stack);
});
