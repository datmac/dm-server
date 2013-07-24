#!/usr/bin/env node
'use strict';

var colors = require('colors'),
    portfinder = require('portfinder'),
    connect = require('connect'),
    ms = require('../lib/mill-server')
;

var optimist = require('optimist')
.usage('Usage: mill-server [options] commands ')
.alias('p', 'port')
.default('p', 8080)
.describe('p', 'Port to use')
.alias('a', 'address')
.default('a', '0.0.0.0')
.describe('a', 'Address to use')
.boolean('s')
.alias('s', 'silent')
.describe('s', 'Suppress log messages from output')
.boolean('h')
.alias('h', 'help')
.describe('h', 'Print this list and exit.');


var argv = optimist.argv,
    nill = function () {},
    log = argv.silent ? nill : console.log
;


if (argv.h || argv._.length === 0) {
  console.log(optimist.help());
  process.exit();
}



function starter(err, port) {
  if (err) {
    throw err;
  }
  var app = connect();
  argv._.forEach(function (plugin) {
      var mdl = ms.middleware(plugin);
      log('Register '.yellow + '/'.blue + plugin.blue + ' ' + (mdl ? 'enabled'.green: 'ignored'.red));
      if (mdl) {
        app.use('/' + plugin, mdl);
      }
    }
  );
  app.listen(port, argv.address);
  log('Starting up mill-server, serving '.yellow
    + argv.address
    + ' on port: '.yellow
    + port.toString().cyan);
  log('Hit CTRL-C to stop the server');
}

if (!argv.port) {
  portfinder.basePort = 8080;
  portfinder.getPort(starter);
}
else {
  starter(null, argv.port);
}
