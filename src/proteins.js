// @flow

import * as d3 from 'd3'
import { dim, halfPixel } from './spatial'

type TSetupProteinsArgs = {
  onProteinMouseover: ?Function,
  onProteinMouseout: ?Function,
  data: Object,
  store: Object,
  scale: number,
  yAxisOffset: number,
  xAxisOffset: number,
  proteinHeight: number,
  height: number,
  draw: Function,
}
type TSetupProteins = (args: TSetupProteinsArgs) => void
let setupProteins: TSetupProteins = ({
  onProteinMouseover,
  onProteinMouseout,
  data,
  store,
  scale,
  yAxisOffset,
  xAxisOffset,
  proteinHeight,
  height,
  draw,
}) => {
  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attrs({
        'clip-path': `url(#chart-clip)`,
        class: `range-${d.id}-${d.start}-${d.end}`,
        x: (d.start * scale) + yAxisOffset + halfPixel,
        y: height - xAxisOffset + halfPixel,
        ...dim(((d.end - d.start) * scale) - 1, proteinHeight - halfPixel),
        fill: `hsl(${i * 100}, 80%, 90%)`,
      })
      .on(`mouseover`, function() {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 85%, 70%)`,
            cursor: `pointer`,
          })

        if (onProteinMouseover) {
          onProteinMouseover(d)
        } else {
          d3.select(`.tooltip`)
            .style(`left`, d3.event.pageX + 20 + `px`)
            .style(`top`, d3.event.pageY - 22 + `px`)
            .html(`
              <div>${d.id}</div>
              <div>${d.description}</div>
              <div><b>Click to zoom</b></div>
            `)
        }
      })
      .on(`mouseout`, function(d) {
        d3.select(this)
          .attrs({
            fill: `hsl(${i * 100}, 80%, 90%)`,
          })

        if (onProteinMouseout) onProteinMouseout(d)

        d3.select(`.tooltip`).style(`left`, `-9999px`)
      })
      .on(`click`, () => {
        store.update({
          animating: true,
          targetMin: d.start,
          targetMax: d.end,
        })
        draw()
      })

    // Protein Names

    d3.select(`.chart`)
      .append(`text`)
      .text(d.id.toUpperCase())
      .attrs({
        class: `protein-name-${d.id}-${d.start}-${d.end}`,
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
        x: (d.start * scale) + yAxisOffset,
        y: height - xAxisOffset + proteinHeight + 60,
        ...dim(((d.end - d.start) * scale), 10 - halfPixel),
        fill: `hsl(${i * 100}, 80%, 70%)`,
        'pointer-events': `none`,
      })
  })
}

/*----------------------------------------------------------------------------*/

export default setupProteins
