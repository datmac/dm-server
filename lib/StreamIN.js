'use strict';

var path = require('path')
, basename = path.basename(__filename, '.js')
, debug = require('debug')('lib:' + basename)
, Transform = require("stream").Transform
;

function Input(options)
{
  Transform.call(this, options);
  this.begin = true;
}

Input.prototype = Object.create(
  Transform.prototype, { constructor: { value: Input }});

Input.prototype._transform = function (chunk, encoding, done) {
  if (this.begin) {
    this.begin = false;
    this.emit('begin');
  }
  this.push(chunk);
  done();
}
Input.prototype.end = function () {
  this.emit('end');
};

module.exports.createStream = function (options) {
  return new Input(options)
}
