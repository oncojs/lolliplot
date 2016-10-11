// @flow

import * as d3 from 'd3'
import attrs from './attrs'

d3.selection.prototype.attrs = attrs

// Easing

type EaseOutCubic = (ci: number, sv: number, cv: number, ti: number) => number
let easeOutCubic: EaseOutCubic = (currentIteration, startValue, changeInValue, totalIterations) =>
  changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue

// Spatial

type DimOb = { width: number, height: number }
type DimFn = (width: number, height: number) => DimOb
let dim: DimFn = (width, height) => ({ width, height })

// Color

let black = `rgb(55, 55, 55)`

// data

type GroupByType = (type: string, data: Array<Object>) => Object
let groupByType: GroupByType = (type, data) => data.reduce((acc, val) => ({
  ...acc, [val[type]]: acc[val[type]] ? [...acc[val[type]], val] : [val]
}), {})

/**
 *  This is the protein viewer function.
*/

export default ({
  clickHandler,
  data,
  selector,
  height,
  width,
  labelSize,
  offsetLeft,
  offsetTop,
} = {}): void => {
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
  let targetMin = min
  let targetMax = max
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

  let consequenceFilters = []
  let impactFilters = []

  // Main Chart

  let svg = d3
    .select(selector)
    .append(`svg`)
    .attrs({
      class: `chart`,
      ...dim(width, height),
    })

  // Chart clipPath

  d3.select(`.chart`)
    .append(`clipPath`)
    .attr(`id`, `chart-clip`)
    .append(`rect`)
    .attrs({
      x: yAxisOffset,
      y: 0,
      ...dim(width - yAxisOffset - statsBoxWidth, height - xAxisOffset + proteinHeight),
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


  // Minimap

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight + 20,
      ...dim(domainWidth, 50),
      stroke: `rgb(138, 138, 138)`,
      fill: `white`,
      cursor: `text`,
    })

  svg
    .append(`g`)
    .append(`clipPath`)
    .attr(`id`, `minimap-clip`)
    .append(`rect`)
    .attrs({
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight + 20,
      ...dim(domainWidth, 50),
    })

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap-zoom-area`,
      x: yAxisOffset + 0.5,
      y: height - xAxisOffset + proteinHeight + 20 + 0.5,
      ...dim(domainWidth - 1, 50 - 1),
      fill: `rgba(162, 255, 196, 0.88)`,
      'pointer-events': `none`,
    })

  // Proteins

  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attrs({
        'clip-path': `url(#chart-clip)`,
        class: `range-${d.id}`,
        x: (d.start * scale) + yAxisOffset + 0.5,
        y: height - xAxisOffset + 0.5,
        ...dim(((d.end - d.start) * scale) - 1, proteinHeight - 0.5),
        fill: `hsl(${i * 100}, 80%, 90%)`,
      })
      .on(`mouseover`, function() {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 85%, 70%)`,
            cursor: `pointer`,
          })

        d3.select(`.tooltip`)
          .style(`left`, d3.event.clientX + 20 + `px`)
          .style(`top`, d3.event.clientY - 22 + `px`)
          .html(`
            <div>${d.id}</div>
            <div>${d.description}</div>
            <div><b>Click to zoom</b></div>
          `)
      })
      .on(`mouseout`, function() {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 80%, 90%)`
          })

        d3.select(`.tooltip`).style(`left`, `-9999px`)
      })
      .on(`click`, function() {
        targetMin = d.start
        targetMax = d.end
        animating = true
        draw()
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
        'pointer-events': `none`,
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
        'pointer-events': `none`,
      })
  })

  // Protein db label

  let proteinDb = `pfam` // TODO: get from data

  d3.select(`.chart`)
    .append(`text`)
    .text(proteinDb)
    .attrs({
      x: 5,
      y: height - xAxisOffset + 25,
      'font-size': `11px`,
    })

  // Mutations

  data.mutations.forEach(d => {
    d3.select(`.chart`)
      .append(`line`)
      .attrs({
        class: `mutation-line-${d.id}`,
        'clip-path': `url(#chart-clip)`,
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
        'clip-path': `url(#chart-clip)`,
        cx: (d.x * scale) + yAxisOffset + 0.5,
        cy: height - xAxisOffset - d.donors * 10,
        r: Math.max(3, d.donors / 2),
        fill: d.impact === `high`
          ? `rgb(194, 78, 78)`
          : d.impact === `low`
            ? `rgb(158, 201, 121)`
            : `rgb(162, 162, 162)`,
      })
      .on(`mouseover`, () => {
        d3.select(`.tooltip`)
          .style(`left`, d3.event.clientX + 20 + `px`)
          .style(`top`, d3.event.clientY - 22 + `px`)
          .html(`
            <div>Mutation ID: ${d.id}</div>
            <div># of Cases: ${d.donors}</div>
            <div>Amino Acid Change: Arg<b>${d.x}</b>Ter</div>
            <div>Functional Impact: ${d.impact}</div>
          `)
      })
      .on(`mouseout`, () => {
        d3.select(`.tooltip`).style(`left`, `-9999px`)
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
        'pointer-events': `none`,
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

  let stats = d3.select(`#root`)
    .append(`div`)
    .attr(`id`, `mutation-stats`)

  stats
    .style(`position`, `absolute`)
    .style('top', `0px`)
    .style('left', width - statsBoxWidth + 35 + `px`)
    .style('line-height', `20px`)
    .append(`div`)
    .text(`${data.mutations.length} Mutations`)
    .attr(`class`, `mutation-count`)
    .style('font-weight', 100)
    .style('font-size', `16px`)

  let consequences = groupByType(`consequence`, data.mutations)
  let impacts = groupByType(`impact`, data.mutations)

  stats
    .append(`div`)
    .text(`Consequence:`)
    .attrs({ class: `consquence-label` })
    .style('font-weight', `bold`)
    .style('font-size', `14px`)

  Object.keys(consequences).map(type => {
    stats
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-consequence-${type}" checked="true" />
        <span class="consquence-counts-${type}">${type}: ${consequences[type].length}</span>
      `)
      .style('font-weight', 100)
      .style('font-size', `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!event.target.id.includes(`toggle-consequence`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked

        consequenceFilters = checked
          ? consequenceFilters.filter(d => d !== type)
          : [...consequenceFilters, type]

        updateStats()

        let selectedMutations = data.mutations.filter(x => x.consequence === type)

        if (!checked) {
          selectedMutations.forEach(d => {
            d3.select(`.mutation-line-${d.id}`).attr(`opacity`, 0)
            d3.selectAll(`.mutation-circle-${d.id}`).attr(`opacity`, 0)
          })
        } else {
          selectedMutations.forEach(d => {
            d3.select(`.mutation-line-${d.id}`).attr(`opacity`, 1)
            d3.selectAll(`.mutation-circle-${d.id}`).attr(`opacity`, 1)
          })
        }
      })
  })

  stats
    .append(`div`)
    .text(`Impact:`)
    .attrs({
      class: `consquence-label`,
    })
    .style('font-weight', `bold`)
    .style('font-size', `14px`)

  Object.keys(impacts).map((type, i) => {
    stats
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-impacts-${type}" checked="true" />
        <span class="impacts-counts-${type}">${type}: ${impacts[type].length}</span>
      `)
      .style('font-weight', 100)
      .style('font-size', `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!event.target.id.includes(`toggle-impacts`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked

        impactFilters = checked
          ? impactFilters.filter(d => d !== type)
          : [...impactFilters, type]

        updateStats()

        let selectedMutations = data.mutations.filter(x => x.impact === type)

        if (!checked) {
          selectedMutations.forEach(d => {
            d3.select(`.mutation-line-${d.id}`).attr(`opacity`, 0)
            d3.selectAll(`.mutation-circle-${d.id}`).attr(`opacity`, 0)
          })
        } else {
          selectedMutations.forEach(d => {
            d3.select(`.mutation-line-${d.id}`).attr(`opacity`, 1)
            d3.selectAll(`.mutation-circle-${d.id}`).attr(`opacity`, 1)
          })
        }
      })
  })

  let updateStats = (): void => {
    let visibleMutations = data.mutations.filter(d =>
      (d.x > min && d.x < max) &&
      !consequenceFilters.includes(d.consequence)
    )

    let visibleConsequences = groupByType(`consequence`, visibleMutations)
    let visibleImpacts = groupByType(`impact`, visibleMutations)

    Object
      .keys(consequences)
      .map(type => {
        if (!visibleConsequences[type]) {
          d3.select(`.consquence-counts-${type}`)
            .text(`${type}: 0`)
        }
      })

    Object
      .keys(impacts)
      .map(type => {
        if (!visibleImpacts[type]) {
          d3.select(`.impacts-counts-${type}`)
            .text(`${type}: 0`)
        }
      })

    d3.select(`.mutation-count`)
      .text(`${visibleMutations.length} Mutations`)

    Object
      .keys(visibleConsequences)
      .filter(type => !consequenceFilters.includes(type))

      .map((type, i) => {
        d3.select(`.consquence-counts-${type}`)
          .text(`${type}: ${visibleConsequences[type].length}`)
      })

    Object
      .keys(visibleImpacts)
      .filter(type => !impactFilters.includes(type))
      .map((type, i) => {
        d3.select(`.impacts-counts-${type}`)
          .text(`${type}: ${visibleImpacts[type].length}`)
        })
  }

  /**
   * Events
  */

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
        'clip-path': `url(#minimap-clip)`,
        x: event.offsetX,
        y: height - xAxisOffset + proteinHeight + 20,
        ...dim(0, 50),
        fill: `rgba(83, 215, 88, 0.51)`,
        cursor: `text`,
      })
  })

  chart.addEventListener(`mouseup`, event => {
    if (dragging) {
      dragging = false

      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)

      targetMin = Math.max(
        0,
        (difference < 0 ? event.offsetX : +zoom.attr(`x`)) - yAxisOffset
      )

      targetMax = Math.min(
        domainWidth,
        (difference < 0 ? event.offsetX + +zoom.attr(`width`) : event.offsetX) - yAxisOffset
      )

      animating = true
      draw()

      zoom.remove()
    }
  })

  chart.addEventListener(`mousemove`, event => {
    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)

      // TODO: prevent zooming beyond domain
      // if (difference + zoomStart > max + yAxisOffset) {
        // difference -= event.offsetX - yAxisOffset - max
      // }

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

  /*
   * Animation Helpers
  */

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

  /*
   * Animation Function
  */

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

      // Protein bars

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
      let x = scaleLinear(d.x)

      d3.select(`.mutation-line-${d.id}`)
        .attrs({
          x1: x,
          x2: x,
        })

      d3.select(`.mutation-circle-${d.id}`)
        .attrs({
          cx: x,
        })
    })

    // Stats

    updateStats()

    // Minimap zoom area

    d3.select(`.minimap-zoom-area`)
      .attrs({
        x: min + yAxisOffset + 0.5,
        width: max - min - 1,
      })

    if (animating) requestAnimationFrame(draw)

  }

}
