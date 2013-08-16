var util = require('util'),
    path = require('path'),
    express = require('express'),
    app = express();

app.configure(function() {
    app.use(function(req, res, next) {
        res.header('cache-control', 'no-store');
        next();
    });

    app.use(express.static(__dirname));
    app.use(express.static(path.resolve(__dirname, '../')));
});

app.get('/GetDemoStuff', function(req, res, next) {
    setTimeout(function() {
        res.json({
            ItemOne: {
                name: 'Item One',
                id: '1'
            },

            ItemTwo: {
                name: 'Item Two',
                id: '2'
            }
        });
        res.end();
    }, req.query.delay||0);
});

app.listen(9200);
util.log('demo listening on 9200');
