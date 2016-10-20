import { dim, halfPixel } from './spatial'
import theme from './theme'

export default ({ svg, height, yAxisOffset, xAxisOffset, xAxisLength, proteinHeight }) => {
  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight + 20,
      ...dim(xAxisLength, 50),
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
      ...dim(xAxisLength, 50),
    })

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap-zoom-area`,
      x: yAxisOffset + halfPixel,
      y: height - xAxisOffset + proteinHeight + 20 + halfPixel,
      ...dim(xAxisLength - 1, 40 - 1),
      fill: `rgba(162, 255, 196, 0.88)`,
      'pointer-events': `none`,
    })

  svg
    .append(`g`)
    .append(`text`)
    .text(`Click and drag over an area, or select a protein to zoom the chart`)
    .attrs({
      class: `minimap-label`,
      x: yAxisOffset,
      y: height - xAxisOffset + proteinHeight + 15,
      'font-size': `11px`,
    })

  svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `minimap-protein-mutation-divider`,
      x1: yAxisOffset,
      y1: height - xAxisOffset + proteinHeight + 60 - halfPixel,
      x2: xAxisLength + yAxisOffset,
      y2: height - xAxisOffset + proteinHeight + 60 - halfPixel,
      stroke: theme.black,
    })
}
