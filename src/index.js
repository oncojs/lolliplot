
import vis from './vis'

let data = {
  proteins: [
    {
      id: `TAS`,
      start: 0,
      end: 75,
      description: `von Hippel-Lindau disease tumour suppressor, beta/alpha domain`,
    },
    {
      id: `DNA-binding`,
      start: 125,
      end: 275,
      description: `von Hippel-Lindau disease tumour suppressor, beta/alpha domain`,
    },
    {
      id: `Oligomerization`,
      start: 325,
      end: 375,
      description: `von Hippel-Lindau disease tumour suppressor, beta/alpha domain`,
    },
    {
      id: `zzz`,
      start: 450,
      end: 500,
      description: `von Hippel-Lindau disease tumour suppressor, beta/alpha domain`,
    },
  ],
  mutations: [
    ...(Array(111).fill(1).map((x, i) => ({
      id: `MU${i}`,
      donors: Math.round((i * Math.random() / 6) % 20),
      x: (i * Date.now()) % 500,
      consequence: `type-${(i % 4) + 1
      }`,
    })).filter(x => x.donors > 0))
  ],
}

// index file
vis({
  selector: `#root`,
  data,
  clickHandler: d => console.dir(d),
  height: 450,
})
