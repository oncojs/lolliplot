var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: [
    './src/vis.js'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'vis.js',
    publicPath: '/static/',
    libraryTarget: 'var',
    library: 'vis', // TODO: get from args
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    }]
  }
}
