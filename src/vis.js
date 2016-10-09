import * as d3 from 'd3'
//import './d3-selection-multi/index'

let easeOutCubic = (currentIteration, startValue, changeInValue, totalIterations) =>
  changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue

export default ({
  clickHandler,
  data,
  selector,
  height,
  width,
  labelSize,
  offsetLeft = 0,
  offsetTop = 0,
} = {}) => {
  // Similar to a React target element
  let root = document.querySelector(selector)

  if (!root) throw `Must select an existing element!`

  width = width || root.clientWidth
  height = height || root.clientHeight
  labelSize = labelSize || `12px`

  let domainWidth = 500
  let rangeHeight = 100
  let scale = width / domainWidth

  let min = 0
  let max = domainWidth
  let startMin = min
  let startMax = max
  let targetMin, targetMax
  let domain = max - min

  let svg = d3
    .select(selector)
    .append(`svg`)
    // .attrs({ class: `chart` })
    .attr(`class`, `chart`)
    .attr(`width`, width)
    .attr(`height`, height)

  let numVerticalLines = 5

  let zooming = false
  let animating = false
  let i = 0
  let ti = 40

  // min text
  svg
    .append(`g`)
    .append(`text`)
    .attr(`class`, `min`)
    .attr(`x`, 0)
    .attr(`y`, 20)
    .attr(`fill`, `black`)
    .text(min)

  // max text
  svg
    .append(`g`)
    .append(`text`)
    .attr(`class`, `max`)
    .attr(`x`, domainWidth)
    .attr(`y`, 20)
    .attr(`fill`, `black`)
    .text(max)

  // zoom select area
  svg
    .append(`g`)
    .append(`rect`)
    .attr(`class`, `select-zoom`)
    .attr(`x`, 0)
    .attr(`y`, 0)
    .attr(`width`, domainWidth)
    .attr(`height`, 50)
    .attr(`fill`, `rgba(83, 215, 88, 0.09)`)

  // domain
  svg
    .append(`g`)
    .append(`line`)
    .attr(`class`, `domain`)
    .attr(`stroke`, `black`)
    .attr(`stroke-width`, 2)
    .attr(`x1`, 0)
    .attr(`y1`, 50)
    .attr(`x2`, domainWidth)
    .attr(`y2`, 50)

  // range
  svg
    .append(`g`)
    .append(`line`)
    .attr(`class`, `range`)
    .attr(`stroke`, `black`)
    .attr(`stroke-width`, 2)
    .attr(`x1`, 0)
    .attr(`y1`, height - rangeHeight)
    .attr(`x2`, width)
    .attr(`y2`, height - rangeHeight)

  for (let i = 0; i < numVerticalLines + 1; i++) {
    // vertical lines
    svg
      .append(`g`)
      .append(`line`)
      .attr(`class`, `line-${i}`)
      .attr(`stroke`, `black`)
      .attr(`stroke-width`, 2)
      .attr(`x1`, ((domain / numVerticalLines) * i) + min)
      .attr(`y1`, 50)
      .attr(`x2`, (width / numVerticalLines) * i)
      .attr(`y2`, height - rangeHeight)
  }

  // proteins on domain
  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attr(`class`, `domain-${d.id}`)
      .attr(`x`, d.start)
      .attr(`y`, 50 - 20)
      .attr(`width`, d.end - d.start)
      .attr(`height`, 20)
      .attr(`fill`, `hsl(${i * 100}, 80%, 70%)`)
  })

  // proteins on range
  data.proteins.forEach((d, i) => {
    d3.select(`.chart`)
      .append(`rect`)
      .attr(`class`, `range-${d.id}`)
      .attr(`x`, d.start * scale)
      .attr(`y`, height - 25)
      .attr(`width`, (d.end - d.start) * scale)
      .attr(`height`, 25)
      .attr(`fill`, `hsl(${i * 100}, 80%, 70%)`)
  })

  let dragging = false
  let zoomStart

  document.querySelector(`.select-zoom`).addEventListener(`mousedown`, event => {
    dragging = true
    zoomStart = event.offsetX

    svg.append(`g`)
      .append(`rect`)
      .attr(`class`, `zoom`)
      .attr(`y`, 0)
      .attr(`x`, event.offsetX)
      .attr(`width`, 0)
      .attr(`height`, 50)
      .attr(`fill`, `rgba(83, 215, 88, 0.51)`)
  })

  document.querySelector(`.chart`).addEventListener(`mouseup`, event => {
    if (dragging) {
      dragging = false

      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)

      targetMin = difference < 0 ? event.offsetX : +zoom.attr(`x`),
      targetMax = difference < 0 ? event.offsetX + +zoom.attr(`width`) : event.offsetX,

      animating = true
      draw(0)

      zoom.remove()
    }
  })

  document.querySelector(`.chart`).addEventListener(`mousemove`, event => {
    if (dragging) {
      let difference = event.offsetX - zoomStart
      let zoom = d3.select(`.zoom`)
      zoom.attr(`width`, Math.abs(difference))

      if (difference < 0) {
        zoom.attr(`x`, event.offsetX)
      }
    }
  })

  let handleAnimationEnd = (min, max) => {
    animating = false
    startMin = min
    startMax = max
    i = 0
  }

  let shouldAnimationFinish = ({ startMin, targetMin, startMax, targetMax, min, max }) => {
    if (
      (startMin < targetMin && startMax < targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin < targetMin && startMax > targetMax) &&
      (min >= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin > targetMin && startMax > targetMax) &&
      (min <= targetMin && max <= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }

    if (
      (startMin < targetMin && startMax < targetMax) &&
      (min >= targetMin && max >= targetMax)
    ) {
      handleAnimationEnd(min, max)
      return
    }
  }

  let calculateNextCoordinate = ({ start, target, i }) => {
    let next = start < target
      ? easeOutCubic(i, start, target - start, ti)
      : start + target - easeOutCubic(i, target, start - target, ti)

    return start < target
      ? Math.min(next, target)
      : Math.max(next, target)
  }

  let draw = t => {

    min = calculateNextCoordinate({ start: startMin, target: targetMin, i })
    max = calculateNextCoordinate({ start: startMax, target: targetMax, i })

    i++

    shouldAnimationFinish({ startMin, startMax, targetMin, targetMax, min, max })

    domain = max - min

    svg.select(`.min`).text(Math.round(min))
    svg.select(`.max`).text(Math.round(max))

    for (let i = 0; i < numVerticalLines + 1; i++) {
      // vertical lines
      svg
        .select(`.line-${i}`)
        .attr(`x1`, ((domain / numVerticalLines) * i) + min)
        .attr(`x2`, (width / numVerticalLines) * i)
        .attr(`y2`, height - rangeHeight)
    }

    // let minTimesScale = min * scale
    // let maxScale = max * scale

    let scaleLinear = d3.scaleLinear()
      .domain([min, max])
      .range([0, width])

    console.log('test', min, max)

    let widthZoomRatio = domainWidth / Math.max((max - min), 0.00001) // Do not divide by zero
    let newRange = max - min
    // proteins on range
    data.proteins.forEach((d, i) => {
      svg
        .select(`.range-${d.id}`)
        .attr(`x`, scaleLinear(d.start))
        .attr(`y`, height - 25)
        .attr(`width`, Math.max(0, (d.end - Math.max(d.start, min)) * widthZoomRatio * scale))
        .attr(`height`, 25)
        .attr(`fill`, `hsl(${i * 100}, 80%, 70%)`)
    })

    if (animating) requestAnimationFrame(draw)

  }

}
