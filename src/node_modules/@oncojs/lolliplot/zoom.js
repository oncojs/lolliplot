import * as d3 from 'd3'
import { dim } from './spatial'

let zoomHandlers = ({
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
}) => {

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
  let slideTarget = document.querySelector(`.minimap-slide-target`)

  let initDrag = ({ selector, y, height, fill }) => (event: Event) => {
    store.update({
      dragging: true,
      zoomStart: event.offsetX,
    })

    svg
      .append(`g`)
      .append(`rect`)
      .attrs({
        class: `${selector}-zoom`,
        'clip-path': `url(#${selector}-clip)`,
        x: event.offsetX,
        y,
        ...dim(0, height),
        fill,
        cursor: `text`,
        'pointer-events': `none`,
      })
  }

  minimap.addEventListener(`mousedown`, initDrag({
    selector: `minimap`,
    y: height - xAxisOffset + proteinHeight + 20,
    height: 50,
    fill: `rgba(83, 215, 88, 0.51)`,
  }))

  chartZoomArea.addEventListener(`mousedown`, initDrag({
    selector: `chart`,
    y: 0,
    height: height - xAxisOffset,
    fill: `rgba(214, 214, 214, 0.51)`,
  }))

  chart.addEventListener(`mouseup`, (event: Event) => {
    let { dragging, zoomStart, sliding } = store.getState()

    if (sliding) store.update({ sliding: false })

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

  let dragMouse = (selector: string) => (event: Event) => {
    let {
      dragging,
      zoomStart,
      sliding,
      slideStart,
      slideStartMin,
      slideStartMax,
    } = store.getState()

    if (sliding) {
      store.update({
        animating: true,
        targetMin: Math.max(0, slideStartMin + event.offsetX - slideStart),
        targetMax: Math.min(domainWidth, slideStartMax + event.offsetX - slideStart),
      })
      draw()
    }

    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(selector)

      zoom.attr(`width`, Math.abs(difference))

      if (difference < 0) {
        zoom.attr(`x`, event.offsetX)
      }
    }
  }

  slideTarget.addEventListener(`mousedown`, (event: Event) => {
    let { min, max } = store.getState()
    store.update({
      sliding: true,
      slideStart: event.offsetX,
      slideStartMin: min,
      slideStartMax: max,
    })
  })

  chart.addEventListener(`mousemove`, dragMouse(`.minimap-zoom`))
  chartZoomArea.addEventListener(`mousemove`, dragMouse(`.chart-zoom`))
}

/*----------------------------------------------------------------------------*/

export default zoomHandlers
