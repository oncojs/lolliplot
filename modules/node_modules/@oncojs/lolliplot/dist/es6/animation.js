
var easeOutCubic = function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
};

var shouldAnimationFinish = function shouldAnimationFinish(_ref) {
  var startMin = _ref.startMin,
      targetMin = _ref.targetMin,
      startMax = _ref.startMax,
      targetMax = _ref.targetMax,
      min = _ref.min,
      max = _ref.max;
  return startMin <= targetMin && startMax <= targetMax && min >= targetMin && max >= targetMax || startMin <= targetMin && startMax >= targetMax && min >= targetMin && max <= targetMax || startMin >= targetMin && startMax >= targetMax && min <= targetMin && max <= targetMax || startMin >= targetMin && startMax <= targetMax && min <= targetMin && max >= targetMax;
};

var calculateNextCoordinate = function calculateNextCoordinate(_ref2) {
  var start = _ref2.start,
      target = _ref2.target,
      currentAnimationIteration = _ref2.currentAnimationIteration,
      totalAnimationIterations = _ref2.totalAnimationIterations;

  var next = start < target ? easeOutCubic(currentAnimationIteration, start, target - start, totalAnimationIterations) : start + target - easeOutCubic(currentAnimationIteration, target, start - target, totalAnimationIterations);

  return start < target ? Math.min(next, target) : Math.max(next, target);
};

/*----------------------------------------------------------------------------*/

export { shouldAnimationFinish, calculateNextCoordinate };