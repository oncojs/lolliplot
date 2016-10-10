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
  let totalAnimationIterations = 30

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
        fill: `hsl(${i * 100}, 80%, 90%)`,
      })
      .on(`mouseover`, function() {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 85%, 70%)`
          })
      })
      .on(`mouseout`, function() {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 80%, 90%)`
          })
      })
      .on(`click`, function() {
        targetMin = d.start
        targetMax = d.end
        animating = true
        draw()
      })
  })

  // Mutations

  data.mutations.forEach(d => {
    d3.select(`.chart`)
      .append(`line`)
      .attrs({
        class: `mutation-line-${d.id}`,
        x1: (d.x * scale) + yAxisOffset + 0.5,
        y1: height - xAxisOffset,
        x2: (d.x * scale) + yAxisOffset + 0.5,
        y2: height - xAxisOffset - d.donors * 10,
        stroke: black,
      })

    d3.select(`.chart`)
      .append(`circle`)
      .attrs({
        class: `mutation-circle-${d.id}`,
        cx: (d.x * scale) + yAxisOffset + 0.5,
        cy: height - xAxisOffset - d.donors * 10,
        r: d.donors,
        fill: `rgb(158, 201, 121)`,
      })
  })

  // Vertical ticks

  let maxDonors = 20 // TODO mutation donor max

  let scaleLinearY = d3.scaleLinear()
    .domain([0, maxDonors])
    .range([height - xAxisOffset, 0])

  svg.append(`g`).attr(`class`, `yTicks`)

  let numYTicks = 8

  for (let i = 1; i < numYTicks; i++) {
    d3.select(`.yTicks`)
      .append(`text`)
      .text(Math.round(maxDonors / numYTicks) * i)
      .attrs({
        class: `yTick-${i}`,
        x: yAxisOffset - 10,
        y: scaleLinearY((maxDonors / numYTicks) * i) + 3,
        'font-size': `11px`,
        'text-anchor': `end`,
      })

    d3.select(`.yTicks`)
      .append(`line`)
      .attrs({
        x1: yAxisOffset - 7,
        y1: scaleLinearY((maxDonors / numYTicks) * i),
        x2: yAxisOffset,
        y2: scaleLinearY((maxDonors / numYTicks) * i),
        stroke: black,
      })
  }

  // Horizontal ticks

  svg.append(`g`).attr(`class`, `xTicks`)

  let numXTicks = 12

  for (let i = 1; i < numXTicks; i++) {
    let length = domainWidth / numXTicks
    d3.select(`.xTicks`)
      .append(`text`)
      .text(Math.round(length * i))
      .attrs({
        class: `xTick-${i}`,
        x: length * i * scale + yAxisOffset,
        y: height - xAxisOffset + 20,
        'font-size': `11px`,
        'text-anchor': `middle`,
      })

    d3.select(`.xTicks`)
      .append(`line`)
      .attrs({
        x1: length * i * scale + yAxisOffset,
        y1: height - xAxisOffset,
        x2: length * i * scale + yAxisOffset,
        y2: height - xAxisOffset + 10,
        stroke: black,
      })
  }

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
  let resetBtn = document.querySelector(`#reset`)

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

      targetMin =
        (difference < 0 ? event.offsetX : +zoom.attr(`x`)) - yAxisOffset

      targetMax =
        (difference < 0 ? event.offsetX + +zoom.attr(`width`) : event.offsetX) - yAxisOffset

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

  resetBtn.addEventListener(`click`, () => {
    targetMin = 0
    targetMax = domainWidth
    animating = true
    draw()
  })

  let handleAnimationEnd = (min, max) => {
    animating = false
    startMin = min
    startMax = max
    currentAnimationIteration = 0
  }

  let shouldAnimationFinish = ({ startMin, targetMin, startMax, targetMax, min, max }) => {
    if (
      (startMin <= targetMin && startMax <= targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin <= targetMin && startMax >= targetMax) &&
      (min >= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin >= targetMin && startMax >= targetMax) &&
      (min <= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin >= targetMin && startMax <= targetMax) &&
      (min <= targetMin && max >= targetMax)
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

    let xLength = width - yAxisOffset - statsBoxWidth

    let scaleLinear = d3.scaleLinear()
      .domain([min, max])
      .range([yAxisOffset, width - statsBoxWidth])

    let widthZoomRatio = domainWidth / Math.max((max - min), 0.00001) // Do not divide by zero

    // Protein bars

    data.proteins.forEach((d, i) => {
      let barWidth = (d.end - Math.max(d.start, min)) * widthZoomRatio * scale
      let x = Math.max(yAxisOffset, scaleLinear(d.start))

      let x2 = x + barWidth

      if (x2 > xLength) {
        barWidth -= x2 - xLength - yAxisOffset
      }

      d3.select(`.range-${d.id}`)
        .attrs({
          x: x + 0.5,
          y: height - xAxisOffset + 0.5,
          ...dim(Math.max(0, barWidth - 1), proteinHeight - 0.5),
          fill: `hsl(${i * 100}, 80%, 90%)`,
        })
    })

    // Horizontal ticks

    for (let i = 1; i < numXTicks; i++) {
      let length = domain / numXTicks
      d3.select(`.xTick-${i}`)
        .text(Math.round((length * i) + min))
    }

    // Mutations

    data.mutations.forEach(d => {
      let x = Math.min(Math.max(yAxisOffset, scaleLinear(d.x)), xLength + yAxisOffset)

      d3.select(`.mutation-line-${d.id}`)
        .attrs({
          x1: x,
          x2: x,
        })

      d3.select(`.mutation-circle-${d.id}`)
        .attrs({
          cx: x,
          r: d.donors,
          fill: `rgb(158, 201, 121)`,
        })
    })

    if (animating) requestAnimationFrame(draw)

  }

}
