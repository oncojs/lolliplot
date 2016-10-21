import * as d3 from 'd3'
import { halfPixel } from './spatial'
import theme from './theme'

let setupMutations = ({
  consequenceColors,
  scaleLinearY,
  clickHandler,
  data,
  yAxisOffset,
  xAxisOffset,
  height,
  proteinHeight,
  scale,
}) => {
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
      y2: d => scaleLinearY(d.donors),
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
      cy: d => scaleLinearY(d.donors),
      r: d => Math.max(3, d.donors / 2),
      fill: d => consequenceColors[d.consequence],
    })
    .on(`mouseover`, function (d) {
      d3.select(`.tooltip`)
        .style(`pointer-events`, `none`)
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

  return { mutationChartLines, mutationChartCircles }
}

let updateMutations = ({ checked, mutationClass, type, data }) => {
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

export {
  setupMutations,
  updateMutations,
}
