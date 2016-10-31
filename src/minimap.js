// @flow

import { dim, halfPixel } from './spatial'
import theme from './theme'

type TSetupMinimapArgs = {
  svg: Object,
  height: number,
  yAxisOffset: number,
  xAxisOffset: number,
  xAxisLength: number,
  proteinHeight: number,
}
type TSetupMinimap = (args: TSetupMinimapArgs) => void
let setupMinimap: TSetupMinimap = props => {
  props.svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: props.yAxisOffset,
      y: props.height - props.xAxisOffset + props.proteinHeight + 20,
      ...dim(props.xAxisLength, 50),
      stroke: `rgb(138, 138, 138)`,
      fill: `white`,
      cursor: `text`,
    })

  props.svg
    .append(`g`)
    .append(`clipPath`)
    .attr(`id`, `minimap-clip`)
    .append(`rect`)
    .attrs({
      x: props.yAxisOffset,
      y: props.height - props.xAxisOffset + props.proteinHeight + 20,
      ...dim(props.xAxisLength, 50),
    })

  props.svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap-zoom-area`,
      x: props.yAxisOffset + halfPixel,
      y: props.height - props.xAxisOffset + props.proteinHeight + 20 + halfPixel,
      ...dim(props.xAxisLength - 1, 40 - 1),
      fill: `rgb(196, 245, 255)`,
      'pointer-events': `none`,
    })

  props.svg
    .append(`g`)
    .append(`text`)
    .text(`Click and drag over an area, or select a protein to zoom the chart`)
    .attrs({
      class: `minimap-label`,
      x: props.yAxisOffset,
      y: props.height - props.xAxisOffset + props.proteinHeight + 15,
      'font-size': `11px`,
    })

  props.svg
    .append(`g`)
    .append(`line`)
    .attrs({
      class: `minimap-protein-mutation-divider`,
      x1: props.yAxisOffset,
      y1: props.height - props.xAxisOffset + props.proteinHeight + 60 - halfPixel,
      x2: props.xAxisLength + props.yAxisOffset,
      y2: props.height - props.xAxisOffset + props.proteinHeight + 60 - halfPixel,
      stroke: theme.black,
    })
}

/*----------------------------------------------------------------------------*/

export default setupMinimap
