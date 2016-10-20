import { select } from 'd3-selection'

let attrsFunction = (selection, map) =>
  selection.each(function () {
    let x = map.apply(this, arguments), s = select(this)
    for (let name in x) s.attr(name, x[name])
  })

let attrsObject = (selection, map) => {
  for (let name in map) selection.attr(name, map[name])
  return selection
}

export default function (map) {
  return (typeof map === `function` ? attrsFunction : attrsObject)(this, map)
}
