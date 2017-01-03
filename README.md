Protein Lolliplot :lollipop: :bar_chart:
=====================

![](lolliplot.gif)

Visualization to view relationship between common mutations and their location on a gene.

### **IMPORTANT: This library does NOT provide its own `d3` object**

**You must pass in `d3` to the constructor function. Currently tested with v3 and v4.**


## Usage

This library exports a top level constructor function which generates the chart,
and a redux store creation function in case you want to set some default store values
before the chart function runs. That is optional though, as the default store will be
returned from the constructor.

```
import ProteinLolliplot, { setupStore } from '@oncojs/lolliplot'

let store = setupStore({ domainWidth: 200 })
store.subscribe(() => {
  let state = store.getState()
  // listen for changes  
})

let = {
  reset,
  updateStats,
  draw,
  remove,
  store: defaultStore,
} = ProteinLolliplot(args)
```

## API

```
type TProteinLolliplotArgs = {
  d3: Object,
  selector: string,
  element: Object,
  data: Object,
  domainWidth: number,
  width: number,
  height: number,
  store?: Object,
  hideStats?: bool,
  selectedMutationClass?: string,
  mutationId?: string,
  yAxisOffset?: number,
  xAxisOffset?: number,
  proteinHeight?: number,
  numXTicks?: number,
  numYTicks?: number,
  proteinDb?: string,
  onMutationClick?: Function,
  onMutationMouseover?: Function,
  onMutationMouseout?: Function,
  onProteinMouseover?: Function,
  onProteinMouseout?: Function,
  onInit?: Function,
}
type TProteinLolliplotReturn = {
  reset: Function,
  updateStats: Function,
  draw: Function,
  remove: Function,
  store: Object,
}
```

### Constructor Arguments

`d3`: Your supplied `d3` object (v3 || v4). **Required!**

`selector`: the selector of the element to attach the chart to

`element`: the element which the viz will attach to. takes precedence over `selector`

**One of `selector` or `element` is required!**

`data`: an object containing an array of proteins and an array of mutations **Required!**

`domainWidth`: The amino acid length of the transcript

`width (optional)`: width of the chart

`height (optional)`: height of the chart

`store (optional)`: the redux store created by `setupStore`

`hideStats (optional)`: if `true`, do not display the summary box next of the chart

`selectedMutationClass (optional)`: sets the default filter on the mutation class (Consequence, Impact, etc)

`mutationId (optional)`: will highlight the mutation matching this id

`yAxisOffset (optional)`: The padding between the left side of the chart and the y axis

`xAxisOffset (optional)`: The padding between the bottom of the chart and the x axis

`proteinHeight (optional)`: The height of the protein row under the main chart

`onInit (optional)`: will run once everything has been setup

#### Mouse events

`onMutationClick (optional)`
`onMutationMouseover (optional)`
`onMutationMouseout (optional)`
`onProteinMouseover (optional)`
`onProteinMouseout (optional)`


### Returned Object

`reset`: Sets the most zoomed out position, and resets any filter options

`updateStats`: Force the stats to update itself based on the current chart zoom level

`draw`: Re-renders the chart (will call recursively while `store.getState().animating === true`)

`remove`: Removes the chart from the DOM and any event handlers created during setup

`store`: The redux store passed in during creation, or the default one if not

## Development

#### Install / Run Dev Server

```
yarn && yarn start
```

Then go to http://localhost:8080/
