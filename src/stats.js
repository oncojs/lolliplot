// @flow

import * as d3 from 'd3'
import groupByType from './groupByType'
import { updateMutations } from './mutations'

type TSetupStatsArgs = {
  data: Object,
  store: Object,
  selector: string,
  hideStats: bool,
  statsBoxWidth: number,
  width: number,
  selectedMutationClass: string,
  consequences: Object,
  impacts: Object,
}
type TSetupStats = (args: TSetupStatsArgs) => void
let setupStats: TSetupStats = ({
  data,
  store,
  selector,
  hideStats,
  statsBoxWidth,
  width,
  selectedMutationClass,
  consequences,
  impacts,
}) => {
  // Stats Bar

  let stats = d3.select(selector)
    .append(`div`)
    .attr(`id`, `mutation-stats`)
    .style(`display`, hideStats ? `none` : `block`)

  stats
    .style(`position`, `absolute`)
    .style(`top`, `0px`)
    .style(`left`, width - statsBoxWidth + 35 + `px`)
    .style(`line-height`, `20px`)
    .append(`div`)
    .html(`Viewing <b>${data.mutations.length}</b> / <b>${data.mutations.length}</b> Mutations`)
    .attr(`class`, `mutation-count`)
    .style(`font-size`, `16px`)

  stats
    .append(`select`)
    .html(`
      <option>Consequence</option>
      <option>Impact</option>
    `)
    .on(`change`, () => {
      d3.selectAll(`[id^=class]`).style(`display`, `none`)
      d3.select(`#class-${d3.event.target.value}`).style(`display`, `block`)
    })

  let consequencesContainer = stats
    .append(`span`)
    .text(`Consequence:`)
    .attr(`id`, `class-Consequence`)
    .style(`display`, selectedMutationClass === `Consequence` ? `block` : `none`)
    .style(`font-weight`, `bold`)
    .style(`font-size`, `14px`)

  Object.keys(consequences).map(type => {
    consequencesContainer
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-consequence-${type}" class="mutation-filter" checked="true" />
        <span class="consquence-counts-${type}">${type}: <b>${consequences[type].length}</b> / <b>${consequences[type].length}</b></span>
      `)
      .style(`font-size`, `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-consequence`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked
        let { consequenceFilters } = store.getState()

        store.update({ consequenceFilters: checked
          ? consequenceFilters.filter(d => d !== type)
          : [...consequenceFilters, type],
        })

        updateStats({ store, data, consequences, impacts })
        updateMutations({ checked, mutationClass: `consequence`, type, data })
      })
  })

  let impactsContainer = stats
    .append(`span`)
    .text(`Impact:`)
    .attr(`id`, `class-Impact`)
    .style(`display`, selectedMutationClass === `Impact` ? `block` : `none`)
    .style(`font-weight`, `bold`)
    .style(`font-size`, `14px`)

  Object.keys(impacts).map(type => {
    impactsContainer
      .append(`div`)
      .html(`
        <input type="checkbox" id="toggle-impacts-${type}" class="mutation-filter" checked="true" />
        <span class="impacts-counts-${type}">${type}: <b>${impacts[type].length}</b> / <b>${impacts[type].length}</b></span>
      `)
      .style(`font-size`, `14px`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-impacts`)) return

        let type = d3.event.target.id.split(`-`).pop()
        let checked = d3.event.target.checked
        let { impactFilters } = store.getState()

        store.update({ impactFilters: checked
          ? impactFilters.filter(d => d !== type)
          : [...impactFilters, type],
        })

        updateStats({ store, data, consequences, impacts })
        updateMutations({ checked, mutationClass: `impact`, type, data })
      })
  })
}

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

export {
  setupStats,
  updateStats,
}
