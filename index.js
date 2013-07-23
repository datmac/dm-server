'use strict';

var path = require('path')
, basename = path.basename(path.dirname(__filename))
, debug = require('debug')('mill:' + basename)
, formatik = require('formatik')
;


module.exports = function (app, plugins) {
  if (Array.isArray(plugins)) {
    plugins.forEach(function (plugin) {

        var manifest = require.resolve(plugin + '/manifest.json');
        if (!manifest) {
          return;
        }
        var command = require(manifest);

        app.put('/' + command.id, function (req, res, next) {
            var form = formatik.parse(req.query, command.parameters || {}, req.session.lang),
                options = form.mget('value');

            req.command = command;
            req.options = options;


            if (!Object.keys(command.parameters).reduce(function (state, key) {
                  if (state && command.parameters[key].require && !options[key]) {
                    res.send(400, '`' + key + '` parameter is missing.');
                    return false;
                  }
                  else {
                    return state;
                  }
                }, true)
            ) {
              return next();
            }

            var Transform = require("stream").Transform;
            var Input = require('../lib/Input');
            var out, inp = new Input();
            inp.on('begin', function () {
                // res.set('Content-Encoding', req.charset);
                res.type(command.output || req.get('content-type') || 'text/plain');
                res.status(200);
              }
            );
            req.pipe(inp);
            out = require(plugin)(inp, options, command);
            if (! out instanceof Transform) {
              res.send(500, 'Invalid command.');
            }
            else {
              out.pipe(res);
              req.resume();
            }
          }
        );
      }
    )
  }
}

