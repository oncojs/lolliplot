
import vis from './vis'

let data = [1, 1, 2, 3, 5, 8, 13, 21]

// index file
vis({
  selector: `#root`,
  data,
  clickHandler: d => console.dir(d),
  height: 400,
})
