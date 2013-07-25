'use strict';

var path = require('path')
, basename = path.basename(path.dirname(__filename))
, debug = require('debug')('mill:server:' + basename)
, formatik = require('formatik')
;

module.exports.load = function (packagename) {
  var filename
  try {
    filename = require.resolve(packagename + '/manifest.json');
  }
  catch (e) {};
  if (!filename) {
    return;
  }
  var manifest = require(filename);
  manifest.packagename = packagename;
  return manifest;
}
module.exports.get = function (manifest, lang) {

  if (!manifest.packagename) {
    return;
  }

  return function (req, res, next) {
    var form = formatik.parse(req.query || {}, manifest.parameters || {},  req.lang || lang || 'en'),
        options = form.mget('value');

    req.manifest = manifest;
    req.options = options;


    if (!Object.keys(manifest.parameters).reduce(function (state, key) {
          if (state && manifest.parameters[key].require && !options[key]) {
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
    var StreamIN = require('./StreamIN.js');
    var out, inp = new StreamIN();
    inp.on('begin', function () {
        // res.set('Content-Encoding', req.charset);
        res.type(manifest.output || req.get('content-type') || 'text/plain');
        res.status(200);
      }
    );
    req.pipe(inp);
    out = require(manifest.packagename)(inp, options, manifest);
    if (! out instanceof Transform) {
      res.send(500, 'Invalid command.');
    }
    else {
      out.pipe(res);
      req.resume();
    }
  }
}
/*
module.exports.xxx = function (server, plugins) {
  if (Array.isArray(plugins)) {
    plugins.forEach(function(plugin) {
      }
    );
  }
}
*/

