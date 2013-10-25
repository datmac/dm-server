'use strict';

var path = require('path')
, basename = path.basename(__filename, '.js')
, debug = require('debug')('dm:server')
, async = require('async')
, http = require('http')
, merge = require('utils-merge')
, querystring = require('querystring')
;

module.exports = function (options, commands, strm, next) {
  if (commands && Array.isArray(commands)) {
    async.reduce(commands, strm, function (previous, item, callback) {
        var qs = querystring.stringify(item.form);
        var opts = {
          host: options.host,
          port: options.port,
          method: 'PUT',
          path: '/' + item.action + '?' + qs,
          headers: item.headers || {}
        }
        debug('/' + options.id + '/' + item.action + ' -  Query String : ', qs ? qs : 'none.');
        var lreq = http.request(opts, function (lres) {
            debug('/' + options.id + '/' + item.action + ' - Status ' + lres.statusCode);
            if (lres.statusCode === 200) {
              callback(null, lres)
            }
            else {
              var msg = lres.statusCode + ' Error ' + opts.path.link.href;
              callback(new Error(msg), lres);
            }
          }
        );
        lreq.on('error', function (e) {
            debug('/' + options.id + '/' + item.action + ' - Piping error :', e);
            callback(e, previous)
          }
        );
        previous.pipe(lreq);
      }, function (err, lastres) {
        if (err) {
          next(err, strm);
        }
        else {
          next(null, lastres);
        }
      }
    );
  }
  else {
    next(null, strm);
  }
}







