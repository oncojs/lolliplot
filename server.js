let webpack = require('webpack')
let WebpackDevServer = require('webpack-dev-server')
let config = require('./webpack.config')

let port = process.env.PORT || 8000

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true
}).listen(port, (err, result) => {
  if (err) {
    return console.log(err)
  }

  console.log(`Listening on port ${port}`)
})
