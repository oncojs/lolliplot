// @flow

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

/**
 *
 *  This is the protein viewer function.
*/
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

  let yAxisOffset = 45
  let xAxisOffset = 200

  let statsBoxWidth = 300
  let proteinHeight = 40

  let xAxisLength = width - yAxisOffset - statsBoxWidth
  let scale = (xAxisLength) / domainWidth

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

  // Proteins

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

    // Chart clipPath
    d3.select(`.chart`)
      .append(`clipPath`)
      .attr(`id`, `chart-clip`)
      .append(`rect`)
      .attrs({
        x: yAxisOffset,
        y: 0,
        width: width - yAxisOffset - statsBoxWidth,
        height: height - xAxisOffset + proteinHeight,
      })

    // Protein Names

    d3.select(`.chart`)
      .append(`text`)
      .text(d.id.toUpperCase())
      .attrs({
        class: `protein-name-${d.id}`,
        'clip-path': `url(#chart-clip)`,
        x: (d.start * scale) + yAxisOffset,
        y: height - xAxisOffset + proteinHeight,
        fill: `hsl(${i * 100}, 80%, 30%)`,
        'font-size': `11px`,
      })

    // Proteins on minimap

    d3.select(`.chart`)
      .append(`rect`)
      .attrs({
        class: `domain-${d.id}`,
        x: d.start + yAxisOffset,
        y: height - xAxisOffset + proteinHeight + 60,
        ...dim(d.end - d.start, 10),
        fill: `hsl(${i * 100}, 80%, 70%)`,
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
        r: Math.max(3, d.donors / 2),
        fill: `rgb(158, 201, 121)`,
      })
      .on(`mouseover`, () => {
        d3.select(`.tooltip`)
          .style(`left`, d3.event.clientX + 15 + `px`)
          .style(`top`, d3.event.clientY - 15 + `px`)
          .html(`
            <div>Mutation ID: ${d.id}</div>
            <div># of Cases: ${d.donors}</div>
            <div>Amino Acid Change: Arg<b>${d.x}</b>Ter</div>
          `)
      })
      .on(`mouseout`, () => {
        d3.select(`.tooltip`)
          .style(`left`, `-9999px`)
      })

    // Mutation lines on minimap

    d3.select(`.chart`)
      .append(`line`)
      .attrs({
        class: `mutation-line-${d.id}`,
        x1: d.x + yAxisOffset,
        y1: height - xAxisOffset + proteinHeight + 70,
        x2: d.x + yAxisOffset + 0.5,
        y2: height - xAxisOffset + proteinHeight - (d.donors * 2) + 70,
        stroke: black,
      })
  })

  // yAxis label

  d3.select(`.chart`)
    .append(`text`)
    .text(`# of Cases`)
    .attrs({
      x: 5,
      y: (height - xAxisOffset) / 2,
      'font-size': `11px`,
      transform: `rotate(270, 10, 124)`,
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
        'pointer-events': `none`,
      })

    d3.select(`.xTicks`)
      .append(`line`)
      .attrs({
        x1: length * i * scale + yAxisOffset,
        y1: height - xAxisOffset,
        x2: length * i * scale + yAxisOffset,
        y2: height - xAxisOffset + 10,
        stroke: black,
        'pointer-events': `none`,
      })
  }

  // Stats Bar

  svg
    .append(`g`)
    .append(`text`)
    .text(`${data.mutations.length} Mutations`)
    .attrs({
      class: `mutation-count`,
      x: width - statsBoxWidth + 20,
      y: 20,
      'font-weight': 100,
    })

  let consequences =
    data.mutations.reduce((acc, val) => ({
      ...acc,
      [val.consequence]: acc[val.consequence]
        ? [...acc[val.consequence], val]
        : [val]
    }), {})

  Object.keys(consequences).map((type, i) => {
    svg
      .append(`g`)
      .append(`text`)
      .text(`${type}: ${consequences[type].length}`)
      .attrs({
        class: `consquence-counts-${type}`,
        x: width - statsBoxWidth + 20,
        y: 20 * (i + 1) + 40,
        'font-weight': 100,
      })

  })

  // Minimap

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight + 20,
      ...dim(domainWidth, 50),
      fill: `rgba(200, 217, 201, 0.09)`,
      stroke: `rgb(138, 138, 138)`,
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
        y: height - xAxisOffset + proteinHeight + 20,
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
        // NOTE: this could be refactored using the chart clip path
        barWidth -= x2 - xLength - yAxisOffset
      }

      d3.select(`.range-${d.id}`)
        .attrs({
          x: x + 0.5,
          y: height - xAxisOffset + 0.5,
          ...dim(Math.max(0, barWidth - 1), proteinHeight - 0.5),
          fill: `hsl(${i * 100}, 80%, 90%)`,
        })

      // Protein names

      d3.select(`.protein-name-${d.id}`)
        .attrs({ x }) // TODO: if offscreen, don't hug left edge
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
          r: Math.max(3, d.donors / 2),
          fill: `rgb(158, 201, 121)`,
        })
    })

    // Mutation count

    let visibleMutations = data.mutations.filter(d => d.x > min && d.x < max)

    let visibleConsequences =
      visibleMutations.reduce((acc, val) => ({
        ...acc,
        [val.consequence]: acc[val.consequence]
        ? [...acc[val.consequence], val]
        : [val]
      }), {})

    Object.keys(consequences).map(type => {
      if (!visibleConsequences[type]) {
        d3.select(`.consquence-counts-${type}`)
          .text(`${type}: 0`)
      }
    })

    d3.select(`.mutation-count`)
      .text(`${visibleMutations.length} Mutations`)

    Object.keys(visibleConsequences).map((type, i) => {
      d3.select(`.consquence-counts-${type}`)
        .text(`${type}: ${visibleConsequences[type].length}`)
    })

    if (animating) requestAnimationFrame(draw)

  }

}
