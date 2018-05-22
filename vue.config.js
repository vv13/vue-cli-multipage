const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const pageEntry = 'main.js'
const pagePatter = 'src/pages/*'
const pageHtmlTemplate = 'index.html'

const genEntryPath = () => {
  const entryPath = {}
  const entries = glob.sync(path.resolve(__dirname, pagePatter))

  entries.forEach((entry) => {
    const filename = path.basename(entry)
    entryPath[filename] = `${entry}/${pageEntry}`
  })
  return entryPath
}

const genHtmlPlugin = () => {
  const dirs = glob.sync(path.resolve(__dirname, pagePatter))
  return dirs.map((dir) => {
    const filename = path.basename(dir)
    return new HtmlWebpackPlugin({
      template: `${dir}/${pageHtmlTemplate}`,
      filename: `${filename}/${pageHtmlTemplate}`,
      inject: true,
      showErrors: false,
      chunks: ['manifest', 'vendor', filename],
    })
  })
}

module.exports = {
  configureWebpack: config => {
    config.entry = genEntryPath()

    if (process.env.NODE_ENV === 'development') {
      config.output = {
        publicPath: '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
      }
    } else {
      config.output = {
        path: path.resolve(__dirname, './dist'),
        filename: '[name]/js/[hash].js',
        chunkFilename: '[name]/js/[id].[hash].js',
      }
    }
    return {
      plugins: [...genHtmlPlugin()]
    }
  },
}
