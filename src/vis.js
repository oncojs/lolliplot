// @flow

import 'babel-polyfill'
import * as d3 from 'd3'
import attrs from './attrs'
import { dim, halfPixel } from './spatial'
import setupStore from './store'
import setupFilters from './filters'
import setupProteins from './proteins'
import setupMinimap from './minimap'
import { shouldAnimationFinish, calculateNextCoordinate } from './animation'
import groupByType from './groupByType'
import updateStats from './updateStats'
import theme from './theme'

/*----------------------------------------------------------------------------*/

d3.selection.prototype.attrs = attrs

/**
 *  This is the protein viewer function.
*/

export default ({
  clickHandler,
  data,
  selector,
  height,
  width,
  domainWidth,
  hideStats,
  selectedMutationClass,
} = {}) => {

  // Similar to a React target element
  let root = document.querySelector(selector)

  if (!root) throw `Must select an existing element!`

  width = width || root.clientWidth
  height = height || root.clientHeight
  domainWidth = domainWidth || 500
  selectedMutationClass = selectedMutationClass || `Consequence`

  let yAxisOffset = 45
  let xAxisOffset = 200

  let statsBoxWidth = hideStats ? 0 : 300
  let proteinHeight = 40

  let xAxisLength = width - yAxisOffset - statsBoxWidth
  let scale = (xAxisLength) / domainWidth

  let totalAnimationIterations = 30

  let store = setupStore({ domainWidth })

  // Main Chart

  let svg = d3
    .select(selector)
    .append(`svg`)
    .attrs({
      class: `chart`,
      ...dim(width, height),
    })

  let defs = svg.append(`defs`)

  setupFilters(defs)

  // Chart clipPath

  defs
    .append(`clipPath`)
    .attr(`id`, `chart-clip`)
    .append(`rect`)
    .attrs({
      x: yAxisOffset,
      y: 0,
      ...dim(xAxisLength, height - xAxisOffset + proteinHeight),
    })

  // Chart zoom area

  d3.select(`.chart`)
    .append(`rect`)
    .attrs({
      class: `chart-zoom-area`,
      x: yAxisOffset,
      y: 0,
      ...dim(xAxisLength, height - xAxisOffset),
      fill: `white`,
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
      stroke: theme.black,
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
      stroke: theme.black,
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
      stroke: theme.black,
    })

  // Horizontal line under protein bar

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `xAxisBottom`,
      x1: yAxisOffset,
      y1: height - xAxisOffset + proteinHeight + halfPixel,
      x2: width - statsBoxWidth,
      y2: height - xAxisOffset + proteinHeight + halfPixel,
      stroke: theme.black,
    })

  setupMinimap({ svg, height, yAxisOffset, xAxisOffset, xAxisLength, proteinHeight })

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

  let mutationChartLines = d3.select(`.chart`)
    .append(`g`)
    .selectAll(`line`)
    .data(data.mutations)
    .enter()
    .append(`line`)
    .attrs({
      class: d => `mutation-line-${d.id}`,
      'clip-path': `url(#chart-clip)`,
      x1: d => (d.x * scale) + yAxisOffset + halfPixel,
      y1: height - xAxisOffset,
      x2: d => (d.x * scale) + yAxisOffset + halfPixel,
      y2: d => height - xAxisOffset - d.donors * 10,
      stroke: `rgba(0, 0, 0, 0.2)`,
    })

  let mutationChartCircles = d3.select(`.chart`)
    .append(`g`)
    .selectAll(`circle`)
    .data(data.mutations)
    .enter()
    .append(`circle`)
    .attrs({
      class: d => `mutation-circle-${d.id}`,
      'clip-path': `url(#chart-clip)`,
      cx: d => (d.x * scale) + yAxisOffset + halfPixel,
      cy: d => height - xAxisOffset - d.donors * 10,
      r: d => Math.max(3, d.donors / 2),
      fill: d => d.impact === `HIGH`
        ? `rgb(194, 78, 78)`
        : d.impact === `MODERATE`
          ? `rgb(158, 201, 121)`
          : `rgb(162, 162, 162)`,
    })
    .on(`mouseover`, function (d) {
      d3.select(`.tooltip`)
        .style(`left`, d3.event.pageX + 20 + `px`)
        .style(`top`, d3.event.pageY - 22 + `px`)
        .html(`
          <div>Mutation ID: ${d.id}</div>
          <div># of Cases: ${d.donors}</div>
          <div>Amino Acid Change: Arg<b>${d.x}</b>Ter</div>
          <div>Functional Impact: ${d.impact}</div>
        `)

      let el = d3.select(this)

      d.pR = +el.attr(`r`)
      d.pFill = el.attr(`fill`)

      el.attr(`cursor`, `pointer`)
        .attr(`filter`, `url(#drop-shadow)`)
        .transition()
        .attr(`r`, d.pR + 8)
        .attr(`fill`, d3.color(el.attr(`fill`)).brighter())
    })
    .on(`mouseout`, function (d) {
      d3.select(`.tooltip`).style(`left`, `-9999px`)

      let el = d3.select(this)

      el.attr(`filter`, null)
        .transition()
        .attr(`r`, d.pR)
        .attr(`fill`, d.pFill)
    })
    .on(`click`, clickHandler)

  data.mutations.forEach(d => {
    // Mutation lines on minimap

    d3.select(`.chart`)
      .append(`line`)
      .attrs({
        class: `mutation-line-${d.id}`,
        x1: (d.x * scale) + yAxisOffset,
        y1: height - xAxisOffset + proteinHeight + 60,
        x2: (d.x * scale) + yAxisOffset + halfPixel,
        y2: height - xAxisOffset + proteinHeight - (d.donors * 1.5) + 60,
        stroke: theme.black,
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
        stroke: theme.black,
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
        stroke: theme.black,
        'pointer-events': `none`,
      })
  }

  // Stats Bar

  let stats = d3.select(selector)
    .append(`div`)
    .attr(`id`, `mutation-stats`)
    .style(`display`, hideStats ? `none` : `block`)

  stats
    .style(`position`, `absolute`)
    .style(`top`, `0px`)
    .style(`left`, width - statsBoxWidth + 35 + `px`)
    .style(`line-height`, `20px`)
    .append(`div`)
    .html(`Viewing <b>${data.mutations.length}</b> / <b>${data.mutations.length}</b> Mutations`)
    .attr(`class`, `mutation-count`)
    .style(`font-size`, `16px`)

  stats
    .append(`select`)
    .html(`
      <option>Consequence</option>
      <option>Impact</option>
    `)
    .on(`change`, () => {
      d3.selectAll(`[id^=class]`).style(`display`, `none`)
      d3.select(`#class-${d3.event.target.value}`).style(`display`, `block`)
    })

  let consequences = groupByType(`consequence`, data.mutations)
  let impacts = groupByType(`impact`, data.mutations)

  let consequencesContainer = stats
    .append(`span`)
    .text(`Consequence:`)
    .attr(`id`, `class-Consequence`)
    .style(`display`, selectedMutationClass === `Consequence` ? `block` : `none`)
    .style(`font-weight`, `bold`)
    .style(`font-size`, `14px`)

  Object.keys(consequences).map(type => {
    consequencesContainer
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-consequence-${type}" class="mutation-filter" checked="true" />
        <span class="consquence-counts-${type}">${type}: <b>${consequences[type].length}</b> / <b>${consequences[type].length}</b></span>
      `)
      .style(`font-size`, `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-consequence`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked
        let { consequenceFilters } = store.getState()

        store.update({ consequenceFilters: checked
          ? consequenceFilters.filter(d => d !== type)
          : [...consequenceFilters, type],
        })

        updateStats({ store, data, consequences, impacts })
        filterMutations(checked, `consequence`, type)
      })
  })

  let impactsContainer = stats
    .append(`span`)
    .text(`Impact:`)
    .attr(`id`, `class-Impact`)
    .style(`display`, selectedMutationClass === `Impact` ? `block` : `none`)
    .style(`font-weight`, `bold`)
    .style(`font-size`, `14px`)

  Object.keys(impacts).map(type => {
    impactsContainer
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-impacts-${type}" class="mutation-filter" checked="true" />
        <span class="impacts-counts-${type}">${type}: <b>${impacts[type].length}</b> / <b>${impacts[type].length}</b></span>
      `)
      .style(`font-size`, `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-impacts`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked
        let { impactFilters } = store.getState()

        store.update({ impactFilters: checked
          ? impactFilters.filter(d => d !== type)
          : [...impactFilters, type],
        })

        updateStats({ store, data, consequences, impacts })
        filterMutations(checked, `impact`, type)
      })
  })

  let filterMutations = (checked, mutationClass, type) => {
    let selectedMutations = mutationClass
      ? data.mutations.filter(x => x[mutationClass] === type)
      : data.mutations.slice()

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
  }

  let reset = () => {
    store.update({
      animating: true,
      targetMin: 0,
      targetMax: domainWidth,
      consequenceFilters: [],
      impactFilters: [],
    })

    d3.selectAll(`.mutation-filter`).property(`checked`, true)
    updateStats({ store, data, consequences, impacts })
    filterMutations(true)
    draw()
  }

  let resetBtn = document.querySelector(`#reset`)
  if (resetBtn) resetBtn.addEventListener(`click`, reset)

  /**
   * Events
  */

  let updateTargetChartZoom = ({ zoomX, zoomWidth, offsetX, difference }) => {
    let { min, max } = store.getState()
    let draggingLeft = difference < 0

    let scale = d3.scaleLinear()
      .domain([0, xAxisLength])
      .range([min, max])

    let targetMin = Math.max(
      0,
      (draggingLeft ? scale(offsetX - yAxisOffset) : scale(zoomX - yAxisOffset))
    )

    let targetMax = Math.min(
      domainWidth,
      (draggingLeft ? scale(offsetX + zoomWidth - yAxisOffset) : scale(offsetX - yAxisOffset))
    )

    return [targetMin, targetMax]
  }

  let updateTargetMinimapZoom = ({ zoomX, zoomWidth, offsetX, difference }) => {
    let draggingLeft = difference < 0

    let targetMin = Math.max(
      0,
      (draggingLeft ? (offsetX - yAxisOffset) / scale : (zoomX - yAxisOffset) / scale)
    )

    let targetMax = Math.min(
      domainWidth,
      (draggingLeft ? (offsetX - yAxisOffset + zoomWidth) / scale : (offsetX - yAxisOffset) / scale)
    )

    return [targetMin, targetMax]
  }

  let minimap = document.querySelector(`.minimap`)
  let chart = document.querySelector(`.chart`)
  let chartZoomArea = document.querySelector(`.chart-zoom-area`)

  minimap.addEventListener(`mousedown`, (event: Event) => {
    store.update({
      dragging: true,
      zoomStart: event.offsetX,
    })

    svg
      .append(`g`)
      .append(`rect`)
      .attrs({
        class: `minimap-zoom`,
        'clip-path': `url(#minimap-clip)`,
        x: event.offsetX,
        y: height - xAxisOffset + proteinHeight + 20,
        ...dim(0, 50),
        fill: `rgba(83, 215, 88, 0.51)`,
        cursor: `text`,
        'pointer-events': `none`,
      })
  })

  chartZoomArea.addEventListener(`mousedown`, (event: Event) => {
    store.update({
      dragging: true,
      zoomStart: event.offsetX,
    })

    svg
      .append(`g`)
      .append(`rect`)
      .attrs({
        class: `chart-zoom`,
        'clip-path': `url(#chart-clip)`,
        x: event.offsetX,
        y: 0,
        ...dim(0, height - xAxisOffset),
        fill: `rgba(214, 214, 214, 0.51)`,
        cursor: `text`,
        'pointer-events': `none`,
      })
  })

  chart.addEventListener(`mouseup`, (event: Event) => {
    let { dragging, zoomStart } = store.getState()

    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.minimap-zoom`)

      if (zoom.empty()) {
        zoom = d3.select(`.chart-zoom`)

        let [targetMin, targetMax] = updateTargetChartZoom({
          zoomX: +zoom.attr(`x`),
          zoomWidth: +zoom.attr(`width`),
          offsetX: event.offsetX, difference,
        })

        store.update({ targetMin, targetMax })
      } else {
        let [targetMin, targetMax] = updateTargetMinimapZoom({
          zoomX: +zoom.attr(`x`),
          zoomWidth: +zoom.attr(`width`),
          offsetX: event.offsetX, difference,
        })

        store.update({ targetMin, targetMax })
      }

      // at least one coordinate zoom
      let { targetMin, targetMax } = store.getState()
      if (targetMin === targetMax) store.update({ targetMax: targetMax + 1 })

      store.update({ animating: true, dragging: false })
      draw()
      zoom.remove()
    }
  })

  let dragMouse = selector => (event: Event) => {
    let { dragging, zoomStart } = store.getState()

    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(selector)

      zoom.attr(`width`, Math.abs(difference))

      if (difference < 0) {
        zoom.attr(`x`, event.offsetX)
      }
    }
  }

  chart.addEventListener(`mousemove`, dragMouse(`.minimap-zoom`))
  chartZoomArea.addEventListener(`mousemove`, dragMouse(`.chart-zoom`))

  /*
   * Animation Function
  */

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

  // Proteins

  setupProteins({
    data,
    store,
    scale,
    yAxisOffset,
    xAxisOffset,
    proteinHeight,
    height,
    draw,
  })

  return {
    reset,
    updateStats,
  }

}
