import * as d3 from 'd3'
import { shouldAnimationFinish, calculateNextCoordinate } from './animation'
import { dim, halfPixel } from './spatial'
import { updateStats } from './stats'

let totalAnimationIterations = 30

let animator = ({
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
}) => {

  let draw = () => {

    let { targetMin, targetMax, startMin, startMax, currentAnimationIteration } = store.getState()

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
      d3.select(`.xTick-${i}`)
        .text(Math.round((length * i) + min))
    }

    // Mutations
    mutationChartLines
      .attr(`x1`, d => scaleLinear(d.x))
      .attr(`x2`, d => scaleLinear(d.x))

    mutationChartCircles
      .attr(`cx`, d => scaleLinear(d.x))

    // Stats

    updateStats({ store, data, consequences, impacts })

    // Minimap zoom area

    d3.select(`.minimap-zoom-area`)
      .attrs({
        x: (min * scale) + yAxisOffset + halfPixel,
        width: Math.max(1, ((max - min) * scale) - 1),
      })

    if (store.getState().animating) window.requestAnimationFrame(draw)
  }

  return draw

}

/*----------------------------------------------------------------------------*/

export default animator
