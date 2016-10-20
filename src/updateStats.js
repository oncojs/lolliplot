// @flow

import * as d3 from 'd3'
import groupByType from './groupByType'

type TUpdateStatsArgs = { store: Object, data: Object, consequences: Object, impacts: Object }
type TUpdateStats = (args: TUpdateStatsArgs) => void
let updateStats: TUpdateStats = ({ store, data, consequences, impacts }) => {
  let { min, max, consequenceFilters, impactFilters } = store.getState()

  let visibleMutations = data.mutations.filter(d =>
    (d.x > min && d.x < max) &&
    !consequenceFilters.includes(d.consequence) &&
    !impactFilters.includes(d.impact)
  )

  let visibleConsequences = groupByType(`consequence`, visibleMutations)
  let visibleImpacts = groupByType(`impact`, visibleMutations)

  Object.keys(consequences).map(type => {
    if (!visibleConsequences[type]) {
      d3.select(`.consquence-counts-${type}`)
        .html(`${type}: <b>0</b> / <b>${consequences[type].length}</b> `)
    }
  })

  Object.keys(impacts).map(type => {
    if (!visibleImpacts[type]) {
      d3.select(`.impacts-counts-${type}`)
        .html(`${type}: <b>0</b> / <b>${impacts[type].length}</b>`)
    }
  })

  d3.select(`.mutation-count`)
    .html(`Viewing <b>${visibleMutations.length}</b> / <b>${data.mutations.length}</b> Mutations`)

  Object
    .keys(visibleConsequences)
    .filter(type => !consequenceFilters.includes(type))
    .map(type => {
      d3.select(`.consquence-counts-${type}`)
        .html(`${type}: <b>${visibleConsequences[type].length}</b> / <b>${consequences[type].length}</b>`)
    })

  Object
    .keys(visibleImpacts)
    .filter(type => !impactFilters.includes(type))
    .map(type => {
      d3.select(`.impacts-counts-${type}`)
        .html(`${type}: <b>${visibleImpacts[type].length}</b> / <b>${impacts[type].length}</b>`)
      })
}

/*----------------------------------------------------------------------------*/

export default updateStats
