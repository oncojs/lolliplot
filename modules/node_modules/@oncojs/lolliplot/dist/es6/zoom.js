import { dim } from './spatial';

var zoomHandlers = function zoomHandlers() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      d3 = _ref.d3,
      d3Root = _ref.d3Root,
      root = _ref.root,
      store = _ref.store,
      yAxisOffset = _ref.yAxisOffset,
      xAxisOffset = _ref.xAxisOffset,
      xAxisLength = _ref.xAxisLength,
      domainWidth = _ref.domainWidth,
      scale = _ref.scale,
      svg = _ref.svg,
      height = _ref.height,
      proteinHeight = _ref.proteinHeight,
      uniqueSelector = _ref.uniqueSelector,
      draw = _ref.draw;

  var updateTargetChartZoom = function updateTargetChartZoom(_ref2) {
    var zoomX = _ref2.zoomX,
        zoomWidth = _ref2.zoomWidth,
        offsetX = _ref2.offsetX,
        difference = _ref2.difference;

    var _store$getState = store.getState(),
        min = _store$getState.min,
        max = _store$getState.max;

    var draggingLeft = difference < 0;

    var scale = d3.scaleLinear().domain([0, xAxisLength]).range([min, max]);

    var targetMin = Math.max(0, draggingLeft ? scale(offsetX - yAxisOffset) : scale(zoomX - yAxisOffset));

    var targetMax = Math.min(domainWidth, draggingLeft ? scale(offsetX + zoomWidth - yAxisOffset) : scale(offsetX - yAxisOffset));

    return [targetMin, targetMax];
  };

  var updateTargetMinimapZoom = function updateTargetMinimapZoom(_ref3) {
    var zoomX = _ref3.zoomX,
        zoomWidth = _ref3.zoomWidth,
        offsetX = _ref3.offsetX,
        difference = _ref3.difference;

    var draggingLeft = difference < 0;

    var targetMin = Math.max(0, draggingLeft ? (offsetX - yAxisOffset) / scale : (zoomX - yAxisOffset) / scale);

    var targetMax = Math.min(domainWidth, draggingLeft ? (offsetX - yAxisOffset + zoomWidth) / scale : (offsetX - yAxisOffset) / scale);

    return [targetMin, targetMax];
  };

  var minimap = root.querySelector('.minimap');
  var chart = root.querySelector('.chart');
  var chartZoomArea = root.querySelector('.chart-zoom-area');
  var slideTarget = root.querySelector('.minimap-slide-target');

  var initDrag = function initDrag(_ref4) {
    var selector = _ref4.selector,
        y = _ref4.y,
        height = _ref4.height,
        fill = _ref4.fill;
    return function (event) {
      store.update({
        dragging: true,
        zoomStart: event.offsetX
      });

      svg.append('g').append('rect').attrs(Object.assign({
        class: selector + '-zoom',
        'clip-path': 'url(#' + uniqueSelector + '-' + selector + '-clip)',
        x: event.offsetX,
        y: y
      }, dim(0, height), {
        fill: fill,
        cursor: 'text',
        'pointer-events': 'none'
      }));
    };
  };

  var minimapMousedownHandler = initDrag({
    selector: 'minimap',
    y: height - xAxisOffset + proteinHeight + 20,
    height: 50,
    fill: 'rgba(83, 215, 88, 0.51)'
  });

  var zoomAreaMousedownHandler = initDrag({
    selector: 'chart',
    y: 0,
    height: height - xAxisOffset,
    fill: 'rgba(214, 214, 214, 0.51)'
  });

  var chartMouseupHandler = function chartMouseupHandler(event) {
    var _store$getState2 = store.getState(),
        dragging = _store$getState2.dragging,
        zoomStart = _store$getState2.zoomStart,
        sliding = _store$getState2.sliding;

    if (sliding) store.update({ sliding: false });

    if (dragging) {
      var difference = event.offsetX - zoomStart;

      // do not zoom if insignificant dragging distance
      if (Math.abs(difference) < 5) {
        d3.select('.minimap-zoom').remove();
        d3.select('.chart-zoom').remove();
        store.update({ dragging: false });
        return;
      }

      var zoom = d3Root.select('.minimap-zoom');

      if (zoom.empty()) {
        zoom = d3Root.select('.chart-zoom');

        var _updateTargetChartZoo = updateTargetChartZoom({
          zoomX: +zoom.attr('x'),
          zoomWidth: +zoom.attr('width'),
          offsetX: event.offsetX, difference: difference
        }),
            _targetMin = _updateTargetChartZoo[0],
            _targetMax = _updateTargetChartZoo[1];

        store.update({ targetMin: _targetMin, targetMax: _targetMax });
      } else {
        var _updateTargetMinimapZ = updateTargetMinimapZoom({
          zoomX: +zoom.attr('x'),
          zoomWidth: +zoom.attr('width'),
          offsetX: event.offsetX, difference: difference
        }),
            _targetMin2 = _updateTargetMinimapZ[0],
            _targetMax2 = _updateTargetMinimapZ[1];

        store.update({ targetMin: _targetMin2, targetMax: _targetMax2 });
      }

      // at least one coordinate zoom

      var _store$getState3 = store.getState(),
          targetMin = _store$getState3.targetMin,
          targetMax = _store$getState3.targetMax;

      if (targetMin === targetMax) store.update({ targetMax: targetMax + 1 });

      store.update({ animating: true, dragging: false });
      draw();
      zoom.remove();
    }
  };

  minimap.addEventListener('mousedown', minimapMousedownHandler);
  chartZoomArea.addEventListener('mousedown', zoomAreaMousedownHandler);
  chart.addEventListener('mouseup', chartMouseupHandler);

  var dragMouse = function dragMouse(selector) {
    return function (event) {
      var _store$getState4 = store.getState(),
          dragging = _store$getState4.dragging,
          zoomStart = _store$getState4.zoomStart,
          sliding = _store$getState4.sliding,
          slideStart = _store$getState4.slideStart,
          slideStartMin = _store$getState4.slideStartMin,
          slideStartMax = _store$getState4.slideStartMax;

      if (sliding) {
        store.update({
          animating: true,
          targetMin: Math.max(0, slideStartMin + Math.round((event.offsetX - slideStart) / scale)),
          targetMax: Math.min(domainWidth, slideStartMax + Math.round((event.offsetX - slideStart) / scale))
        });
        draw();
      }

      if (dragging) {
        var difference = event.offsetX - zoomStart;
        var zoom = d3.select(selector);

        zoom.attr('width', Math.abs(difference));

        if (difference < 0) {
          zoom.attr('x', event.offsetX);
        }
      }
    };
  };

  var handleSlideTargetMousedown = function handleSlideTargetMousedown(event) {
    var _store$getState5 = store.getState(),
        min = _store$getState5.min,
        max = _store$getState5.max;

    store.update({
      sliding: true,
      slideStart: event.offsetX,
      slideStartMin: min,
      slideStartMax: max
    });
  };

  slideTarget.addEventListener('mousedown', handleSlideTargetMousedown);

  var chartDragHandler = dragMouse('.minimap-zoom');
  var zoomAreaDragHandler = dragMouse('.chart-zoom');
  chart.addEventListener('mousemove', chartDragHandler);
  chartZoomArea.addEventListener('mousemove', zoomAreaDragHandler);

  var removeZoomHandlers = function removeZoomHandlers() {
    slideTarget.removeEventListener('mousedown', handleSlideTargetMousedown);
    chart.removeEventListener('mousemove', chartDragHandler);
    chartZoomArea.removeEventListener('mousemove', zoomAreaDragHandler);
    minimap.removeEventListener('mousedown', minimapMousedownHandler);
    chartZoomArea.removeEventListener('mousedown', zoomAreaMousedownHandler);
    chart.removeEventListener('mouseup', chartMouseupHandler);
  };

  return { removeZoomHandlers: removeZoomHandlers };
};

/*----------------------------------------------------------------------------*/

export default zoomHandlers;