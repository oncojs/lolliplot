// @flow

import 'babel-polyfill'
import * as d3 from 'd3'
import attrs from './attrs'
import { dim, halfPixel } from './spatial'
import setupStore from './store'
import setupFilters from './filters'
import setupMinimap from './minimap'
import setupProteins from './proteins'
import { setupMutations, updateMutations } from './mutations'
import { setupStats, updateStats } from './stats'
import setupTicks from './ticks'
import setupZoomHandlers from './zoom'
import theme from './theme'
import groupByType from './groupByType'
import animator from './animator'

/*----------------------------------------------------------------------------*/

d3.selection.prototype.attrs = attrs

type TProteinLolliplotArgs = {
  clickHandler: Function,
  data: Object,
  selector: string,
  height: number,
  width: number,
  domainWidth: number,
  hideStats: bool,
  selectedMutationClass: string,
}
type TProteinLolliplot = (args: TProteinLolliplotArgs) => Object
let proteinLolliplot: TProteinLolliplot = ({
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

  let numXTicks = 12
  let numYTicks = 15

  let store = setupStore({ domainWidth })

  let consequences = groupByType(`consequence`, data.mutations)
  let impacts = groupByType(`impact`, data.mutations)

  let colorScale = d3.scaleOrdinal(d3.schemeCategory20).domain(d3.range(20))

  let consequenceColors = Object.keys(consequences).reduce((acc, type, i) => ({
    ...acc,
    [type]: colorScale(i * 3),
  }), {})

  let maxDonors = Math.max(...data.mutations.map(x => x.donors))

  let scaleLinearY = d3.scaleLinear()
    .domain([0, Math.round(maxDonors + 5)])
    .range([height - xAxisOffset, 0])

  let proteinDb = `pfam` // TODO: get from data

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
      y: halfPixel,
      ...dim(xAxisLength, height - xAxisOffset + proteinHeight - halfPixel),
      fill: `white`,
      stroke: `rgb(181, 181, 181)`,
      'stroke-width': 1,
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

  d3.select(`.chart`)
    .append(`text`)
    .text(proteinDb)
    .attrs({
      x: 5,
      y: height - xAxisOffset + 25,
      'font-size': `11px`,
    })

  let { mutationChartLines, mutationChartCircles } = setupMutations({
    consequenceColors,
    scaleLinearY,
    clickHandler,
    data,
    yAxisOffset,
    xAxisOffset,
    height,
    proteinHeight,
    scale,
    maxDonors,
    store,
  })

  let draw = animator({
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
  })

  setupStats({
    consequenceColors,
    data,
    store,
    selector,
    hideStats,
    statsBoxWidth,
    width,
    selectedMutationClass,
    consequences,
    impacts,
    mutationChartLines,
    mutationChartCircles,
    height,
    xAxisOffset,
  })

  let reset = () => {
    store.update({
      animating: true,
      targetMin: 0,
      targetMax: domainWidth,
      consequenceFilters: [],
      impactFilters: [],
    })

    updateStats({ store, data, consequences, impacts, consequenceColors })
    updateMutations({ checked: true, data })
    draw()
  }

  let resetBtn = document.querySelector(`#reset`)
  if (resetBtn) resetBtn.addEventListener(`click`, reset)

  setupZoomHandlers({
    store,
    yAxisOffset,
    xAxisOffset,
    xAxisLength,
    domainWidth,
    scale,
    svg,
    height,
    proteinHeight,
    draw,
  })

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

  setupTicks({
    svg,
    numYTicks,
    numXTicks,
    maxDonors,
    scaleLinearY,
    xAxisOffset,
    yAxisOffset,
    domainWidth,
    scale,
    height,
  })

  return {
    reset,
    updateStats,
  }

}

/*----------------------------------------------------------------------------*/

export default proteinLolliplot
