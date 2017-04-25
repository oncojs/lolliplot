var filters = function filters(defs) {
  var filter = defs.append("filter").attr("id", "drop-shadow").attr("height", "180%").attr("width", "180%").attr("x", "-40%").attr("y", "-40%");

  filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 3).attr("result", "blur");

  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode").attr("in", "blur");

  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
};

export default filters;