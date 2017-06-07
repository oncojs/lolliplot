// @flow

import invariant from 'invariant'
import ReactFauxDOM from 'react-faux-dom'
import attrs from './utils/attrs'
import { dim, halfPixel } from './utils/spatial'
import uuid from './utils/uuid'
import withZoomState from './utils/withZoomState'

/*----------------------------------------------------------------------------*/

let Minimap = ({
  d3,
  height = 50,
  width,
  domainWidth = 500,
  yAxisOffset = 45,
  min,
  max,
  dragging,
  sliding,
  _update,
  update,
  offsetX,
  zoomStart,
  slideStartMin,
  slideStartMax,
  slideStart,
} = {}) => {

  invariant(d3, `You must pass in the d3 library, either v3 || v4`)

  d3.selection.prototype.attrs = attrs
  d3.scaleOrdinal = d3.scaleOrdinal || d3.scale.ordinal
  d3.scaleLinear = d3.scaleLinear || d3.scale.linear

  // Similar to a React target element
  let root = ReactFauxDOM.createElement(`div`)

  invariant(root, `Must provide an element or selector!`)

  width = width || root.clientWidth
  height = height || root.clientHeight

  let uniqueSelector = uuid()
  let xAxisLength = width - yAxisOffset
  let scale = xAxisLength / domainWidth

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

  // Main Chart

  let d3Root = d3.select(root).style(`position`, `relative`)

  let svg = d3Root
    .append(`svg`)
    .attrs({
      class: `chart`,
      ...dim(width, height),
    })
    .on(`mousemove`, () => {
      if (sliding) {
        const MAGIC_OFFSET_ADJUSTMENT =
          document.getElementById(`lolliplot-container`).getBoundingClientRect().left

        const offset = d3.event.clientX - MAGIC_OFFSET_ADJUSTMENT

        update({
          min: Math.max(0, slideStartMin + Math.round((offset - slideStart) / scale)),
          max: Math.min(
            domainWidth,
            slideStartMax + Math.round((offset - slideStart) / scale)
          ),
        })
      }
    })
    .on(`mouseup`, () => {
      if (sliding) {
        _update({ sliding: false })
      }

      if (dragging) {

        let difference = offsetX - zoomStart

        // do not zoom if insignificant dragging distance
        if (Math.abs(difference) < 5) {
          _update({ dragging: false, draggingMinimap: false })
          return
        }

        let [targetMin, targetMax] = updateTargetMinimapZoom({
          zoomX: difference < 0 ? offsetX : zoomStart,
          zoomWidth: Math.abs(difference),
          offsetX,
          difference,
        })

        update({
          min: targetMin,
          max: targetMax,
        })

        _update({
          dragging: false,
          draggingMinimap: false,
        })
      }
    })

  let defs = svg.append(`defs`)

  // Chart clipPath

  defs
    .append(`clipPath`)
    .attr(`id`, `${uniqueSelector}-chart-clip`)
    .append(`rect`)
    .attrs({
      x: yAxisOffset,
      y: 0,
      ...dim(xAxisLength, height),
    })

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap`,
      x: yAxisOffset,
      y: 0,
      ...dim(xAxisLength, 50),
      fill: `rgba(0, 0, 0, 0)`,
      cursor: `text`,
    })
    .on(`mousedown`, () => {
      const MAGIC_OFFSET_ADJUSTMENT =
        document.getElementById(`lolliplot-container`).getBoundingClientRect().left

      _update({
        dragging: true,
        zoomStart: d3.event.clientX - MAGIC_OFFSET_ADJUSTMENT,
        offsetX: d3.event.clientX - MAGIC_OFFSET_ADJUSTMENT,
      })
    })
    .on(`mousemove`, () => {
      if (dragging) {
        const MAGIC_OFFSET_ADJUSTMENT =
          document.getElementById(`lolliplot-container`).getBoundingClientRect().left

        _update({
          offsetX: d3.event.clientX - MAGIC_OFFSET_ADJUSTMENT,
        })
      }
    })

  svg
    .append(`g`)
    .append(`clipPath`)
    .attr(`id`, `${uniqueSelector}-minimap-clip`)
    .append(`rect`)
    .attrs({
      x: yAxisOffset,
      y: 0,
      ...dim(xAxisLength, 50),
    })

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap-zoom-area`,
      x: (min * scale) + yAxisOffset + halfPixel,
      y: halfPixel,
      height: 50 - 1,
      width: Math.max(1, ((max - min) * scale) - 1),
      fill: `rgba(0, 0, 0, 0)`,
      'pointer-events': `none`,
    })

  if (dragging) {
    let difference = offsetX - zoomStart

    svg
      .append(`g`)
      .append(`rect`)
      .attrs({
        'clip-path': `url(#${uniqueSelector}-clip)`,
        x: difference < 0 ? offsetX : zoomStart,
        y: 0,
        width: Math.abs(difference),
        height: 50,
        fill: `rgba(83, 215, 88, 0.51)`,
        cursor: `text`,
        'pointer-events': `none`,
      })
  }

  let minimapWidth = Math.max(1, ((max - min) * scale) - 1)

  svg
    .append(`g`)
    .append(`rect`)
    .attrs({
      class: `minimap-slide-target`,
      x: (min * scale) + yAxisOffset + halfPixel + minimapWidth - 20,
      y: 5,
      ...dim(15, 15),
      fill: `rgb(255, 255, 255)`,
      stroke: `rgb(57, 57, 57)`,
      cursor: `move`,
    })
    .on(`mousedown`, () => {
      const MAGIC_OFFSET_ADJUSTMENT =
        document.getElementById(`lolliplot-container`).getBoundingClientRect().left

      _update({
        sliding: true,
        slideStart: d3.event.clientX - MAGIC_OFFSET_ADJUSTMENT,
        slideStartMin: min,
        slideStartMax: max,
      })
    })

  svg
    .append(`text`)
    .text(`⟺`)
    .attrs({
      class: `minimap-slide-target-arrow`,
      x: (min * scale) + yAxisOffset + halfPixel + minimapWidth - 19,
      y: 16,
      'font-size': `11px`,
      'pointer-events': `none`,
    })

  return root.toReact()

}

/*----------------------------------------------------------------------------*/

export default withZoomState(Minimap)
