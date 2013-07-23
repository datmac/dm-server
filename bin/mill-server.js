#!/usr/bin/env node

var colors = require('colors'),
    argv = require('optimist').argv,
    portfinder = require('portfinder');

if (argv.h || argv.help) {
  console.log([
      "usage: mill-server [path] [options]",
      "",
      "options:",
      "  -p                 Port to use [8080]",
      "  -a                 Address to use [0.0.0.0]",
      "  -s --silent        Suppress log messages from output",
      "  -h --help          Print this list and exit."
    ].join('\n'));
  process.exit();
}
