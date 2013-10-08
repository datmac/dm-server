'use strict';

var path = require('path')
, basename = path.basename(__filename, '.js')
, debug = require('debug')('dm:server')
, fs = require('fs')
;

module.exports = function (packagename) {
  var names = [ packagename, 'dm-' + packagename ];
  var m = function (name) {
    try {
      return {
        manifest : require.resolve(name + '/manifest.json'),
        package : require.resolve(name + '/package.json'),
        name : name
      };
    }
    catch (e) {
      return;
    }
  };
  var r = function (prev, cur) {
    return prev === undefined ? cur : prev;
  };
  var plugin = names.map(m).reduce(r, undefined);

  if (!plugin) {
    return;
  }

  var manifest = require(plugin.manifest);
  var stat = fs.statSync(plugin.manifest);
  manifest.packagename = plugin.name;
  manifest.package = require(plugin.package);
  manifest.url =  '/' + manifest.id;
  manifest.accessed = stat.atime;
  manifest.updated = stat.mtime;
  manifest.published = stat.ctime;

  return manifest;
}
