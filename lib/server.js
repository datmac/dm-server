'use strict';

var path = require('path')
, basename = path.basename(__filename, '.js')
, debug = require('debug')('dm:server')
, formatik = require('formatik')
, fs = require('fs')
;

// multi commands
module.exports.exec = require('./exec.js')

// single and local command
module.exports.run = function (options, manifest, strm0, next) {
  module.exports.exec(options, manifest.prepend, strm0, function (err, strm1) {    // PREPEND
      debug('/' + options.id + ' - Launched');
      var strm2 = require(manifest.packagename)(manifest.form, strm1);      // COMMAND
      module.exports.exec(options, manifest.append, strm2, next);                  // APPEND
    }
  )
}

module.exports.load = require('./load.js')

module.exports.command = function (manifest, lang) {

  if (!manifest.packagename) {
    return;
  }

  return function (req, res, next) {
    var form = formatik.parse(req.query || {}, manifest.parameters || {},  req.lang || lang || 'en');
    var options = {
      id: manifest.id,
      host: req.socket.server.address().address,
      port: req.socket.server.address().port,
      headers : req.headers
    };


    // Save input values
    manifest.form = form.mget('value');
    debug('/' + manifest.id + ' - Form received.', manifest.form)

    //
    if (!Object.keys(manifest.parameters).reduce(function (state, key) {
          if (state && manifest.parameters[key].require && !manifest.values[key]) {
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

    var strm0 = require('./StreamIN.js').createStream();
    strm0.on('begin', function () {
        res.statusCode = 200;
        res.setHeader('Content-Type', manifest.output || req.headers['content-type'] || 'text/plain');
      }
    );
    var strm1 = req.pipe(strm0);
    try
    {
      module.exports.run(options, manifest, strm1, function (err, strm2) {
          strm2.pipe(res);
        }
      )
      req.resume(); // ! req. must be paused
      debug('/' + manifest.id + ' - Input stream is open.');
    }
    catch (e)
    {
      next(new Error('/' + manifest.id + ' - Failed.'));
    }
  }
}
