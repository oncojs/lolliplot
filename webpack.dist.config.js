let path = require(`path`)

module.exports = {
  entry: [
    `./src/ProteinLolliplot.js`,
  ],
  output: {
    path: path.join(__dirname, `dist`),
    filename: `ProteinLolliplot.js`,
    publicPath: `/static/`,
    libraryTarget: `var`,
    library: `ProteinLolliplot`, // TODO: get from args
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [`babel`],
      include: path.join(__dirname, `src`),
    }],
  },
}
