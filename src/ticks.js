import * as d3 from 'd3'
import theme from './theme'

let setupTicks = ({
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
}) => {

  // Vertical ticks

  svg.append(`g`).attr(`class`, `yTicks`)

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
}

/*----------------------------------------------------------------------------*/

export default setupTicks
