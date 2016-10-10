
import vis from './vis'

let data = {
  proteins: [
    {
      id: `TAS`,
      start: 0,
      end: 75,
    },
    {
      id: `DNA-binding`,
      start: 125,
      end: 275,
    },
    {
      id: `Oligomerization`,
      start: 325,
      end: 375,
    },
  ],
  mutations: [
    {
      id: 'MU1',
      donors: 10,
      x: 100,
    },
    {
      id: 'MU2',
      donors: 7,
      x: 220,
    },
  ]
}

// index file
vis({
  selector: `#root`,
  data,
  clickHandler: d => console.dir(d),
  height: 400,
})
