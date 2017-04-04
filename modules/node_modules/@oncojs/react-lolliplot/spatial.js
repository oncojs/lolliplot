/* @flow */

type DimOb = { width: number, height: number }
type DimFn = (width: number, height: number) => DimOb
export let dim: DimFn = (width, height) => ({ width, height })

export let halfPixel = 0.5
