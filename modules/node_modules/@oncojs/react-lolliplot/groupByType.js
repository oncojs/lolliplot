// @flow

type GroupByType = (type: string, data: Array<Object>) => Object
let groupByType: GroupByType = (type, data) => data.reduce((acc, val) => ({
  ...acc, [val[type]]: acc[val[type]] ? [...acc[val[type]], val] : [val],
}), {})

export default groupByType
