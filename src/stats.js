// @flow

import * as d3 from 'd3'
import groupByType from './groupByType'
import { updateMutations } from './mutations'
import theme from './theme'
import { animateScaleY } from './animator'

// TODO: place in theme?
let impactsColors = {
  HIGH: `rgb(221, 60, 60)`,
  MODERATE: `rgb(132, 168, 56)`,
  default: `rgb(135, 145, 150)`,
}

type TSetupStatsArgs = {
  consequenceColors: Object,
  data: Object,
  store: Object,
  selector: string,
  hideStats: bool,
  statsBoxWidth: number,
  width: number,
  selectedMutationClass: string,
  consequences: Object,
  impacts: Object,
  mutationChartLines: Object,
  mutationChartCircles: Object,
  height: number,
  xAxisOffset: number,
}
type TSetupStats = (args: TSetupStatsArgs) => void
let setupStats: TSetupStats = ({
  consequenceColors,
  data,
  store,
  selector,
  hideStats,
  statsBoxWidth,
  width,
  selectedMutationClass,
  consequences,
  impacts,
  mutationChartLines,
  mutationChartCircles,
  height,
  xAxisOffset,
}) => {
  // Stats Bar

  let stats = d3.select(selector)
    .append(`div`)
    .attr(`id`, `mutation-stats`)
    .style(`display`, hideStats ? `none` : `block`)
    .style(`background-color`, `white`)
    .style(`border`, `1px solid rgb(186, 186, 186)`)
    .style(`padding`, `13px`)
    .style(`width`, `${statsBoxWidth}px`)

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
    .style(`margin-top`, `6px`)
    .on(`change`, () => {
      d3.selectAll(`[id^=class]`).style(`display`, `none`)
      d3.select(`#class-${d3.event.target.value}`).style(`display`, `block`)

      d3.selectAll(`[class^=mutation-circle]`)
        .attr(`fill`, d => d3.event.target.value === `Consequence`
          ? consequenceColors[d.consequence]
          : impactsColors[d.impact] || impactsColors.default
        )
    })

  stats
    .append(`div`)
    .text(`Click to filter mutations`)
    .style(`margin-top`, `6px`)
    .style(`font-size`, `11px`)
    .style(`color`, theme.black)

  let consequencesContainer = stats
    .append(`span`)
    .text(`Consequence:`)
    .attr(`id`, `class-Consequence`)
    .style(`display`, selectedMutationClass === `Consequence` ? `block` : `none`)
    .style(`margin-top`, `6px`)
    .style(`font-size`, `14px`)

  Object.keys(consequences).map(type => {
    consequencesContainer
      .append(`div`)
      .html(`
        <span id="toggle-consequence-${type}" data-checked="true" style="background-color: ${consequenceColors[type]}; border: 2px solid ${consequenceColors[type]}; display: inline-block; width: 23px; cursor: pointer; margin-right: 6px;">&nbsp;</span>
        <span>${type}:</span>
        <span style="margin: 0 10px 0 auto;" class="consquence-counts-${type}">
          <b>${consequences[type].length}</b> / <b>${consequences[type].length}</b>
        </span>
      `)
      .style(`margin-top`, `6px`)
      .style(`font-size`, `14px`)
      .style(`display`, `flex`)
      .style(`align-items`, `center`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-consequence`)) return

        let type = d3.event.target.id.split(`-`).pop()

        d3.event.target.dataset.checked = d3.event.target.dataset.checked === `true`
          ? `false`
          : `true`

        let checked = d3.event.target.dataset.checked === `true`
        let { consequenceFilters } = store.getState()

        d3.select(`#toggle-consequence-${type}`)
          .style(`background-color`, checked ? consequenceColors[type] : `white`)

        store.update({ consequenceFilters: checked
          ? consequenceFilters.filter(d => d !== type)
          : [...consequenceFilters, type],
        })

        updateStats({
          store,
          data,
          consequences,
          impacts,
          consequenceColors,
          mutationChartLines,
          mutationChartCircles,
          height,
          xAxisOffset,
        })

        updateMutations({ checked, mutationClass: `consequence`, type, data })
      })
  })

  let impactsContainer = stats
    .append(`span`)
    .text(`Impact:`)
    .attr(`id`, `class-Impact`)
    .style(`display`, selectedMutationClass === `Impact` ? `block` : `none`)
    .style(`margin-top`, `6px`)
    .style(`font-size`, `14px`)

  Object.keys(impacts).map(type => {
    impactsContainer
      .append(`div`)
      .html(`
        <span id="toggle-impacts-${type}" data-checked="true" style="background-color: ${impactsColors[type] || impactsColors.default}; border: 2px solid ${impactsColors[type] || impactsColors.default}; display: inline-block; width: 23px; cursor: pointer; margin-right: 6px;">&nbsp;</span>
        <span>${type}:</span>
        <span style="margin: 0 10px 0 auto;" class="impacts-counts-${type}">
          <b>${impacts[type].length}</b> / <b>${impacts[type].length}</b>
        </span>
      `)
      .style(`margin-top`, `6px`)
      .style(`font-size`, `14px`)
      .style(`display`, `flex`)
      .style(`align-items`, `center`)
      .on(`click`, () => {
        // Bail if not the checkbox above
        if (!d3.event.target.id.includes(`toggle-impacts`)) return

        let type = d3.event.target.id.split(`-`).pop()

        d3.event.target.dataset.checked = d3.event.target.dataset.checked === `true`
          ? `false`
          : `true`

        let checked = d3.event.target.dataset.checked === `true`
        let { impactFilters } = store.getState()

        d3.select(`#toggle-impacts-${type}`)
          .style(`background-color`, checked ? (impactsColors[type] || impactsColors.default) : `white`)

        store.update({ impactFilters: checked
          ? impactFilters.filter(d => d !== type)
          : [...impactFilters, type],
        })

        updateStats({
          store,
          data,
          consequences,
          impacts,
          consequenceColors,
          mutationChartLines,
          mutationChartCircles,
          height,
          xAxisOffset,
        })

        updateMutations({ checked, mutationClass: `impact`, type, data })
      })
  })
}

type TUpdateStatsArgs = {
  store: Object,
  data: Object,
  consequences: Object,
  impacts: Object,
  consequenceColors: Object,
  mutationChartLines: Object,
  mutationChartCircles: Object,
  height: number,
  xAxisOffset: number,
}
type TUpdateStats = (args: TUpdateStatsArgs) => void
let updateStats: TUpdateStats = ({
  store,
  data,
  consequences,
  impacts,
  consequenceColors,
  mutationChartLines,
  mutationChartCircles,
  height,
  xAxisOffset,
}) => {
  let { min, max, consequenceFilters, impactFilters, animating } = store.getState()

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
        .html(`<b>0</b> / <b>${consequences[type].length}</b> `)
    } else {
      d3.select(`#toggle-consequence-${type}`)
        .attr(`data-checked`, `true`)
        .style(`background-color`, consequenceColors[type])
    }
  })

  Object.keys(impacts).map(type => {
    if (!visibleImpacts[type]) {
      d3.select(`.impacts-counts-${type}`)
        .html(`<b>0</b> / <b>${impacts[type].length}</b>`)
    } else {
      d3.select(`#toggle-impacts-${type}`)
        .attr(`data-checked`, `true`)
        .style(`background-color`, impactsColors[type] || impactsColors.default)
    }
  })

  d3.select(`.mutation-count`)
    .html(`Viewing <b>${visibleMutations.length}</b> / <b>${data.mutations.length}</b> Mutations`)

  Object
    .keys(visibleConsequences)
    .filter(type => !consequenceFilters.includes(type))
    .map(type => {
      d3.select(`.consquence-counts-${type}`)
        .html(`<b>${visibleConsequences[type].length}</b> / <b>${consequences[type].length}</b>`)
    })

  Object
    .keys(visibleImpacts)
    .filter(type => !impactFilters.includes(type))
    .map(type => {
      d3.select(`.impacts-counts-${type}`)
        .html(`<b>${visibleImpacts[type].length}</b> / <b>${impacts[type].length}</b>`)
      })

  if (!animating) {
    animateScaleY({
      data,
      consequenceFilters,
      impactFilters,
      min,
      max,
      mutationChartLines,
      mutationChartCircles,
      height,
      xAxisOffset,
      visibleMutations,
    })
  }
}

/*----------------------------------------------------------------------------*/

export {
  setupStats,
  updateStats,
}