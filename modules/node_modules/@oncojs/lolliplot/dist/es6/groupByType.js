
var groupByType = function groupByType(type, data) {
  return data.reduce(function (acc, val) {
    var _Object$assign;

    return Object.assign({}, acc, (_Object$assign = {}, _Object$assign[val[type]] = acc[val[type]] ? [].concat(acc[val[type]], [val]) : [val], _Object$assign));
  }, {});
};

export default groupByType;