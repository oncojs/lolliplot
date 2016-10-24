import 'babel-polyfill'
import ProteinLolliplot from './ProteinLolliplot'
import mockData from './data'

ProteinLolliplot({
  selector: `#root`,
  data: mockData(80),
  clickHandler: d => console.log(d),
  height: 450,
  // hideStats: true,
  domainWidth: 500,
})

/*----------------------------------------------------------------------------*/

let range = document.querySelector(`#mut-count`)
let label = document.querySelector(`#mut-count-label`)
let root = document.querySelector(`#root`)

window.range = range

range.oninput = event => {
  root.innerHTML = ``
  label.innerText = event.target.value
  ProteinLolliplot({
    selector: `#root`,
    data: mockData(+event.target.value),
    clickHandler: d => console.dir(d),
    height: 450,
  })
}
