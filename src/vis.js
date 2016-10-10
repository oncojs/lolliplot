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
  let xAxisOffset = 200

  let statsBoxWidth = 300
  let proteinHeight = 40

  let scale = (width - yAxisOffset - statsBoxWidth) / domainWidth

  let zooming = false
  let animating = false
  let currentAnimationIteration = 0
  let totalAnimationIterations = 40

  let dragging = false
  let zoomStart

  // Main Chart

  let svg = d3
    .select(selector)
    .append(`svg`)
    .attrs({
      class: `chart`,
      ...dim(width, height),
    })

  // yAxis

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

  // xAxis

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

  // Vertical line on the right of the protein bar

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

  // Horizontal line under protein bar

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

    // Protein Bar

    data.proteins.forEach((d, i) => {
      d3.select(`.chart`)
        .append(`rect`)
        .attrs({
          class: `range-${d.id}`,
          x: (d.start * scale) + yAxisOffset + 0.5,
          y: height - xAxisOffset + 0.5,
          ...dim(((d.end - d.start) * scale) - 1, proteinHeight - 0.5),
          fill: `hsl(${i * 100}, 80%, 70%)`,
        })
    })

  // Minimap

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight,
      ...dim(domainWidth, 50),
      fill: `rgba(83, 215, 88, 0.09)`
    })

  // Proteins on minimap

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

  let minimap = document.querySelector(`.minimap`)
  let chart = document.querySelector(`.chart`)

  minimap.addEventListener(`mousedown`, event => {
    dragging = true
    zoomStart = event.offsetX

    svg
      .append(`g`)
      .append(`rect`)
      .attrs({
        class: `zoom`,
        x: event.offsetX,
        y: height - xAxisOffset + proteinHeight,
        ...dim(0, 50),
        fill: `rgba(83, 215, 88, 0.51)`,
      })
  })


  chart.addEventListener(`mouseup`, event => {
    if (dragging) {
      dragging = false

      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)

      targetMin = difference < 0 ? event.offsetX : +zoom.attr(`x`),
      targetMax = difference < 0 ? event.offsetX + +zoom.attr(`width`) : event.offsetX,

      animating = true
      draw()

      zoom.remove()
    }
  })

  chart.addEventListener(`mousemove`, event => {
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
    currentAnimationIteration = 0
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

  let calculateNextCoordinate = ({ start, target, currentAnimationIteration }) => {
    let next = start < target
      ? easeOutCubic(currentAnimationIteration, start, target - start, totalAnimationIterations)
      : start + target - easeOutCubic(currentAnimationIteration, target, start - target, totalAnimationIterations)

    return start < target
      ? Math.min(next, target)
      : Math.max(next, target)
  }

  let draw = () => {

    min = calculateNextCoordinate({ start: startMin, target: targetMin, currentAnimationIteration })
    max = calculateNextCoordinate({ start: startMax, target: targetMax, currentAnimationIteration })

    currentAnimationIteration++

    shouldAnimationFinish({ startMin, startMax, targetMin, targetMax, min, max })

    domain = max - min

    let scaleLinear = d3.scaleLinear()
      .domain([min, max])
      .range([0, width])

    let widthZoomRatio = domainWidth / Math.max((max - min), 0.00001) // Do not divide by zero

    // proteins on range
    data.proteins.forEach((d, i) => {
      let width = Math.max(0, (d.end - Math.max(d.start, min)) * widthZoomRatio * scale)

      d3.select(`.range-${d.id}`)
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
