
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
    ...(Array(200).fill(1).map((x, i) => ({
      id: `MU${i}`,
      donors: Math.round((i * Math.random() / 10) % 20),
      x: (i * Date.now()) % 500,
      consequence: `type_${(i % 4) + 1}`,
      impact:  Math.random() * 10 < 3.33
        ? `high`
        : Math.random() * 10 > 6.66
          ? `low` : `unknown`

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
