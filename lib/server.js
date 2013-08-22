'use strict';

var path = require('path')
, basename = path.basename(__filename, '.js')
, debug = require('debug')('mill:server')
, formatik = require('formatik')
, fs = require('fs')
;

module.exports.load = function (packagename) {
  var names = [ packagename, 'mill-' + packagename ];
  var filename = names.reduce(function (prev, cur) {
      if (!prev) {
        try {
          var t = require.resolve(cur + '/manifest.json');
          return t;
        }
        catch (e) {
          return;
        }
      }
      else {
        return prev;
      }
    }, undefined
  );
  if (!filename) {
    return;
  }

  var manifest = require(filename);
  var stat = fs.statSync(filename);
  manifest.packagename = packagename;
  manifest.url =  '/' + manifest.id;
  manifest.accessed = stat.atime;
  manifest.updated = stat.mtime;
  manifest.published = stat.ctime;

  return manifest;
}

module.exports.command = function (manifest, lang) {

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
        res.statusCode = 200;
        res.setHeader('Content-Type', manifest.output || req.headers['content-type'] || 'text/plain');
      }
    );
    req.pipe(inp);
    out = require(manifest.packagename)(options, inp, manifest);
    if (! out instanceof Transform) {
      res.send(500, 'Invalid command.');
    }
    else {
      out.pipe(res);
      //req.resume(); cf. changelog node-0.10.* 
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

