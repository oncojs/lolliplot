import * as d3 from 'd3'
import attrs from './attrs'

d3.selection.prototype.attrs = attrs

// Easing

let easeOutCubic = (currentIteration, startValue, changeInValue, totalIterations) =>
  changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue

// Spatial

let dim = (width, height) => ({ width, height })

// Color

let black = `rgb(55, 55, 55)`

export default ({
  clickHandler,
  data,
  selector,
  height,
  width,
  labelSize,
  offsetLeft = 0,
  offsetTop = 0,
} = {}) => {
  // Similar to a React target element
  let root = document.querySelector(selector)

  if (!root) throw `Must select an existing element!`

  width = width || root.clientWidth
  height = height || root.clientHeight
  labelSize = labelSize || `12px`

  let domainWidth = 500
  let rangeHeight = 100

  let min = 0
  let max = domainWidth
  let startMin = min
  let startMax = max
  let targetMin, targetMax
  let domain = max - min

  let yAxisOffset = 35
  let xAxisOffset = 100

  let statsBoxWidth = 300
  let proteinHeight = 40

  let scale = (width - yAxisOffset - statsBoxWidth) / domainWidth

  let svg = d3
    .select(selector)
    .append(`svg`)
    .attrs({
      class: `chart`,
      ...dim(width, height),
    })

  let zooming = false
  let animating = false
  let i = 0
  let ti = 40

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `yAxis`,
      x1: yAxisOffset,
      y1: 0,
      x2: yAxisOffset,
      y2: height - xAxisOffset + proteinHeight,
      stroke: black,
    })

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `yAxisRight`,
      x1: width - statsBoxWidth,
      y1: height - xAxisOffset,
      x2: width - statsBoxWidth,
      y2: height - xAxisOffset + proteinHeight,
      stroke: black,
    })

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `xAxis`,
      x1: yAxisOffset,
      y1: height - xAxisOffset,
      x2: width - statsBoxWidth,
      y2: height - xAxisOffset,
      stroke: black,
    })

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `xAxisBottom`,
      x1: yAxisOffset,
      y1: height - xAxisOffset + proteinHeight + 0.5,
      x2: width - statsBoxWidth,
      y2: height - xAxisOffset + proteinHeight + 0.5,
      stroke: black,
    })

  // zoom select area
  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `select-zoom`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight,
      ...dim(domainWidth, 50),
      fill: `rgba(83, 215, 88, 0.09)`
    })

  // proteins on domain
  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attrs({
        class: `domain-${d.id}`,
        x: d.start + yAxisOffset,
        y: height - xAxisOffset + proteinHeight + 50,
        ...dim(d.end - d.start, 20),
        fill: `hsl(${i * 100}, 80%, 70%)`,
      })
  })

  // proteins on range
  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attrs({
        class: `range-${d.id}`,
        x: (d.start * scale) + yAxisOffset + 0.5,
        y: height - xAxisOffset + 0.5,
        ...dim((d.end - d.start) * scale, proteinHeight - 0.5),
        fill: `hsl(${i * 100}, 80%, 70%)`,
      })
  })

  let dragging = false
  let zoomStart

  document.querySelector(`.select-zoom`).addEventListener(`mousedown`, event => {
    dragging = true
    zoomStart = event.offsetX

    svg.append(`g`)
      .append(`rect`)
      .attrs({
        class: `zoom`,
        x: event.offsetX,
        y: 0,
        ...dim(0, 50),
        fill: `rgba(83, 215, 88, 0.51)`,
      })
  })

  document.querySelector(`.chart`).addEventListener(`mouseup`, event => {
    if (dragging) {
      dragging = false

      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)

      targetMin = difference < 0 ? event.offsetX : +zoom.attr(`x`),
      targetMax = difference < 0 ? event.offsetX + +zoom.attr(`width`) : event.offsetX,

      animating = true
      draw(0)

      zoom.remove()
    }
  })

  document.querySelector(`.chart`).addEventListener(`mousemove`, event => {
    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)
      zoom.attr(`width`, Math.abs(difference))

      if (difference < 0) {
        zoom.attr(`x`, event.offsetX)
      }
    }
  })

  let handleAnimationEnd = (min, max) => {
    animating = false
    startMin = min
    startMax = max
    i = 0
  }

  let shouldAnimationFinish = ({ startMin, targetMin, startMax, targetMax, min, max }) => {
    if (
      (startMin < targetMin && startMax < targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin < targetMin && startMax > targetMax) &&
      (min >= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin > targetMin && startMax > targetMax) &&
      (min <= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin < targetMin && startMax < targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }
  }

  let calculateNextCoordinate = ({ start, target, i }) => {
    let next = start < target
      ? easeOutCubic(i, start, target - start, ti)
      : start + target - easeOutCubic(i, target, start - target, ti)

    return start < target
      ? Math.min(next, target)
      : Math.max(next, target)
  }

  let draw = t => {

    min = calculateNextCoordinate({ start: startMin, target: targetMin, i })
    max = calculateNextCoordinate({ start: startMax, target: targetMax, i })

    i++

    shouldAnimationFinish({ startMin, startMax, targetMin, targetMax, min, max })

    domain = max - min

    let scaleLinear = d3.scaleLinear()
      .domain([min, max])
      .range([0, width])

    let widthZoomRatio = domainWidth / Math.max((max - min), 0.00001) // Do not divide by zero

    // proteins on range
    data.proteins.forEach((d, i) => {
      let width = Math.max(0, (d.end - Math.max(d.start, min)) * widthZoomRatio * scale)

      svg
        .select(`.range-${d.id}`)
        .attrs({
          x: Math.max(0, scaleLinear(d.start)) + yAxisOffset + 0.5,
          y: height - xAxisOffset + 0.5,
          ...dim(width, proteinHeight - 0.5),
          fill: `hsl(${i * 100}, 80%, 70%)`,
        })
    })

    if (animating) requestAnimationFrame(draw)

  }

}
