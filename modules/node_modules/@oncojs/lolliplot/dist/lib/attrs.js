'use strict';

exports.__esModule = true;

exports.default = function (map) {
  return (typeof map === 'function' ? attrsFunction : attrsObject)(this, map);
};

var _d3Selection = require('d3-selection');

var attrsFunction = function attrsFunction(selection, map) {
  return selection.each(function () {
    var x = map.apply(this, arguments),
        s = (0, _d3Selection.select)(this);
    for (var name in x) {
      s.attr(name, x[name]);
    }
  });
};

var attrsObject = function attrsObject(selection, map) {
  for (var name in map) {
    selection.attr(name, map[name]);
  }return selection;
};