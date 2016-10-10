
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
    {
      id: `zzz`,
      start: 450,
      end: 500,
    },
  ],
  mutations: [
    // {
    //   id: 'MU1',
    //   donors: 10,
    //   x: 100,
    // },
    // {
    //   id: 'MU2',
    //   donors: 7,
    //   x: 250,
    // },
    ...(Array(111).fill(1).map((x, i) => ({
      id: `MU${i}`,
      donors: (i * Math.random() / 6) % 20,
      x: (i * Date.now()) % 500,
    })))
  ],
}

// index file
vis({
  selector: `#root`,
  data,
  clickHandler: d => console.dir(d),
  height: 500,
})
