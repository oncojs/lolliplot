// @flow

import * as d3 from 'd3'
import { shouldAnimationFinish, calculateNextCoordinate } from './animation'
import { dim, halfPixel } from './spatial'
import { updateStats } from './stats'

let totalAnimationIterations = 30

type TAnimatorArgs = {
  store: Object,
  data: Object,
  yAxisOffset: number,
  xAxisOffset: number,
  statsBoxWidth: number,
  height: number,
  width: number,
  domainWidth: number,
  scale: number,
  proteinHeight: number,
  numXTicks: number,
  mutationChartLines: Object,
  mutationChartCircles: Object,
  consequences: Object,
  impacts: Object,
  consequenceColors: Object,
}
type TAnimator = (args: TAnimatorArgs) => Function
let animator: TAnimator = ({
  store,
  data,
  yAxisOffset,
  xAxisOffset,
  statsBoxWidth,
  height,
  width,
  domainWidth,
  scale,
  proteinHeight,
  numXTicks,
  mutationChartLines,
  mutationChartCircles,
  consequences,
  impacts,
  consequenceColors,
}) => {

  let draw = () => {

    let {
      targetMin,
      targetMax,
      startMin,
      startMax,
      currentAnimationIteration,
      consequenceFilters,
      impactFilters,
    } = store.getState()

    let min = calculateNextCoordinate({
      start: startMin, target: targetMin, currentAnimationIteration, totalAnimationIterations,
    })

    let max = calculateNextCoordinate({
      start: startMax, target: targetMax, currentAnimationIteration, totalAnimationIterations,
    })

    let domain = max - min

    store.update({ min, max, domain, currentAnimationIteration: currentAnimationIteration + 1 })

    if (shouldAnimationFinish({ startMin, startMax, targetMin, targetMax, min, max })) {
      store.update({
        animating: false,
        startMin: min,
        startMax: max,
        currentAnimationIteration: 0,
      })
    }

    let scaleLinear = d3.scaleLinear()
      .domain([min, max])
      .range([yAxisOffset, width - statsBoxWidth])

    let widthZoomRatio = domainWidth / Math.max((max - min), 0.00001) // Do not divide by zero

    // Protein bars

    data.proteins.forEach((d, i) => {
      let barWidth = (d.end - Math.max(d.start, min)) * widthZoomRatio * scale
      let x = scaleLinear(d.start)

      // Protein bars

      d3.select(`.range-${d.id}`)
        .attrs({
          x:  Math.max(yAxisOffset, x) + halfPixel,
          y: height - xAxisOffset + halfPixel,
          ...dim(Math.max(0, barWidth - 1), proteinHeight - halfPixel),
          fill: `hsl(${i * 100}, 80%, 90%)`,
        })

      // Protein names

      d3.select(`.protein-name-${d.id}`)
        .attrs({
          x: barWidth + yAxisOffset < yAxisOffset ? x : Math.max(yAxisOffset, x),
        })
    })

    // Horizontal ticks

    for (let i = 1; i < numXTicks; i++) {
      let length = domain / numXTicks
      d3.select(`.xTick-text-${i}`)
        .text(Math.round((length * i) + min))
    }

    // Minimap zoom area

    d3.select(`.minimap-zoom-area`)
      .attrs({
        x: (min * scale) + yAxisOffset + halfPixel,
        width: Math.max(1, ((max - min) * scale) - 1),
      })

    mutationChartLines
      .attr(`x1`, d => scaleLinear(d.x))
      .attr(`x2`, d => scaleLinear(d.x))

    mutationChartCircles
      .attr(`cx`, d => scaleLinear(d.x))

    animateScaleY({
      data,
      consequenceFilters,
      impactFilters,
      min,
      max,
      mutationChartLines,
      mutationChartCircles,
      height,
      xAxisOffset,
      visibleMutations: null,
    })

    updateStats({
      store,
      data,
      consequences,
      impacts,
      consequenceColors,
      mutationChartLines,
      mutationChartCircles,
      height,
      xAxisOffset,
    })

    if (store.getState().animating) window.requestAnimationFrame(draw)
  }

  return draw

}

type TAnimateScaleYArgs = {
  data: Object,
  consequenceFilters: Array<string>,
  impactFilters: Array<string>,
  min: number,
  max: number,
  mutationChartLines: Object,
  mutationChartCircles: Object,
  height: number,
  xAxisOffset: number,
  visibleMutations: ?Array<Object>,
}
type TAnimateScaleY = (args: TAnimateScaleYArgs) => void
let animateScaleY: TAnimateScaleY = ({
  data,
  consequenceFilters,
  impactFilters,
  min,
  max,
  mutationChartLines,
  mutationChartCircles,
  height,
  xAxisOffset,
  visibleMutations: vm,
}) => {
  let visibleMutations = vm || data.mutations.filter(d =>
    (d.x > min && d.x < max) &&
    !consequenceFilters.includes(d.consequence) &&
    !impactFilters.includes(d.impact)
  )

  if (visibleMutations.length) {

    let maxDonors = Math.max(...visibleMutations.map(x => x.donors))

    let scaleLinearY = d3.scaleLinear()
      .domain([0, Math.round(maxDonors + 5)])
      .range([height - xAxisOffset, 0])

    mutationChartLines
      .transition()
      .attr(`y2`, d => scaleLinearY(d.donors))

    mutationChartCircles
      .transition()
      .attr(`cy`, d => scaleLinearY(d.donors))

    // Vertical ticks

    let numYTicks = d3.selectAll(`[class^='yTick-text']`).size()

    for (let i = 1; i < numYTicks + 1; i += 1) {
      d3.select(`.yTick-text-${i}`)
        .transition()
        .attr(`y`, scaleLinearY(i) + 3)

      d3.select(`.yTick-line-${i}`)
        .transition()
        .attr(`y1`, scaleLinearY(i))
        .attr(`y2`, scaleLinearY(i))
    }
  }
}

/*----------------------------------------------------------------------------*/

export default animator
export { animateScaleY }
