// @flow

import * as d3 from 'd3'
import theme from './theme'

type TSetupTicksArgs = {
  svg: Object,
  numXTicks: number,
  maxDonors: number,
  scaleLinearY: Function,
  xAxisOffset: number,
  yAxisOffset: number,
  domainWidth: number,
  scale: number,
  height: number,
}
type TSetupTicks = (args: TSetupTicksArgs) => void
let setupTicks: TSetupTicks = ({
  svg,
  numXTicks,
  maxDonors,
  scaleLinearY,
  xAxisOffset,
  yAxisOffset,
  domainWidth,
  scale,
  height,
}) => {

  // Vertical ticks

  svg.append(`g`).attr(`class`, `yTicks`)

  for (let i = 1; i < maxDonors + 5; i += 1) {
    d3.select(`.yTicks`)
      .append(`text`)
      .text(i)
      .attrs({
        class: `yTick-text-${i}`,
        x: yAxisOffset - 10,
        y: scaleLinearY(i) + 3,
        'font-size': `11px`,
        'text-anchor': `end`,
      })

    d3.select(`.yTicks`)
      .append(`line`)
      .attrs({
        class: `yTick-line-${i}`,
        x1: yAxisOffset - 7,
        y1: scaleLinearY(i),
        x2: yAxisOffset,
        y2: scaleLinearY(i),
        stroke: theme.black,
      })
  }

  // Horizontal ticks

  svg.append(`g`).attr(`class`, `xTicks`)

  for (let i = 1; i < numXTicks; i++) {
    let length = domainWidth / numXTicks

    d3.select(`.xTicks`)
      .append(`text`)
      .text(Math.round(length * i))
      .attrs({
        class: `xTick-text-${i}`,
        x: length * i * scale + yAxisOffset,
        y: height - xAxisOffset + 20,
        'font-size': `11px`,
        'text-anchor': `middle`,
        'pointer-events': `none`,
      })

    d3.select(`.xTicks`)
      .append(`line`)
      .attrs({
        class: `xTick-line-${i}`,
        x1: length * i * scale + yAxisOffset,
        y1: height - xAxisOffset,
        x2: length * i * scale + yAxisOffset,
        y2: height - xAxisOffset + 10,
        stroke: theme.black,
        'pointer-events': `none`,
      })
  }
}

/*----------------------------------------------------------------------------*/

export default setupTicks
