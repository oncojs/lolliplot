import range from 'lodash.range';
import theme from './theme';

var setupTicks = function setupTicks(_ref) {
  var d3Root = _ref.d3Root,
      svg = _ref.svg,
      numXTicks = _ref.numXTicks,
      maxDonors = _ref.maxDonors,
      scaleLinearY = _ref.scaleLinearY,
      xAxisOffset = _ref.xAxisOffset,
      yAxisOffset = _ref.yAxisOffset,
      domainWidth = _ref.domainWidth,
      scale = _ref.scale,
      height = _ref.height;


  // Vertical ticks

  svg.append('g').attr('class', 'yTicks');

  var highestValue = Math.max(10, maxDonors);

  var yTicks = d3Root.select('.yTicks').append('g').selectAll('text').data(range(1, highestValue, highestValue / 7)).enter().append('text').text(function (i) {
    return Math.round(i);
  }).attrs({
    class: function _class(i) {
      return 'yTick-text-' + i;
    },
    x: yAxisOffset - 10,
    y: function y(i) {
      return scaleLinearY(i) + 3;
    },
    'font-size': '11px',
    'text-anchor': 'end'
  });

  var yTicksLine = d3Root.select('.yTicks').append('g').selectAll('line').data(range(1, highestValue, highestValue / 7)).enter().append('line').attrs({
    class: function _class(i) {
      return 'yTick-line-' + i;
    },
    x1: yAxisOffset - 7,
    y1: function y1(i) {
      return scaleLinearY(i);
    },
    x2: yAxisOffset,
    y2: function y2(i) {
      return scaleLinearY(i);
    },
    stroke: theme.black
  });

  // Horizontal ticks

  svg.append('g').attr('class', 'xTicks');

  var length = domainWidth / numXTicks;
  var xTicks = d3Root.select('.xTicks').append('g').selectAll('text').data(range(numXTicks - 1).map(function (x) {
    return x + 1;
  })).enter().append('text').text(function (i) {
    return Math.round(length * i);
  }).attrs({
    class: function _class(i) {
      return 'xTick-text-' + i;
    },
    x: function x(i) {
      return length * i * scale + yAxisOffset;
    },
    y: height - xAxisOffset + 20,
    'font-size': '11px',
    'text-anchor': 'middle',
    'pointer-events': 'none'
  });

  for (var i = 1; i < numXTicks; i++) {
    var _length = domainWidth / numXTicks;

    d3Root.select('.xTicks').append('line').attrs({
      class: 'xTick-line-' + i,
      x1: _length * i * scale + yAxisOffset,
      y1: height - xAxisOffset,
      x2: _length * i * scale + yAxisOffset,
      y2: height - xAxisOffset + 10,
      stroke: theme.black,
      'pointer-events': 'none'
    });
  }

  return {
    xTicks: xTicks,
    yTicks: yTicks,
    yTicksLine: yTicksLine
  };
};

/*----------------------------------------------------------------------------*/

export default setupTicks;