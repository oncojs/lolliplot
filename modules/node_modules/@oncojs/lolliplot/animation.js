/* @flow */

type TEaseOutCubic = (ci: number, sv: number, cv: number, ti: number) => number
let easeOutCubic: TEaseOutCubic = (currentIteration, startValue, changeInValue, totalIterations) =>
  changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue

type TShouldAnimationFinishArgs = {
  startMin: number, targetMin: number, startMax: number, targetMax: number, min: number, max: number
}
type TShouldAnimationFinish = (args: TShouldAnimationFinishArgs) => bool
let shouldAnimationFinish: TShouldAnimationFinish = ({
  startMin, targetMin, startMax, targetMax, min, max,
}) =>
    (
      (startMin <= targetMin && startMax <= targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) ||
    (
      (startMin <= targetMin && startMax >= targetMax) &&
      (min >= targetMin && max <= targetMax)
    ) ||
    (
      (startMin >= targetMin && startMax >= targetMax) &&
      (min <= targetMin && max <= targetMax)
    ) ||
    (
      (startMin >= targetMin && startMax <= targetMax) &&
      (min <= targetMin && max >= targetMax)
    )

type TCalculateNextCoordinateArgs = {
  start: number, target: number, currentAnimationIteration: number, totalAnimationIterations: number
}
type TCalculateNextCoordinate = (args: TCalculateNextCoordinateArgs) => number
let calculateNextCoordinate: TCalculateNextCoordinate = ({ start, target, currentAnimationIteration, totalAnimationIterations }) => {
  let next = start < target
    ? easeOutCubic(currentAnimationIteration, start, target - start, totalAnimationIterations)
    : start + target - easeOutCubic(currentAnimationIteration, target, start - target, totalAnimationIterations)

  return start < target
    ? Math.min(next, target)
    : Math.max(next, target)
}

/*----------------------------------------------------------------------------*/

export {
  shouldAnimationFinish,
  calculateNextCoordinate,
}
