const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = {
  pageEntry: 'main.js',
  pagePatter: 'src/pages/*',
  pageHtmlTemplate: 'index.html',
}

const modeDev = process.env.NODE_ENV === 'development'


const genEntryPath = () => {
  const entryPath = {}
  const entries = glob.sync(path.resolve(__dirname, config.pagePatter))

  entries.forEach((entry) => {
    const filename = path.basename(entry)
    entryPath[filename] = `${entry}/${config.pageEntry}`
  })
  return entryPath
}

const genHtmlPlugin = () => {
  const dirs = glob.sync(path.resolve(__dirname, config.pagePatter))
  return dirs.map((dir) => {
    const filename = path.basename(dir)
    return {
      template: `${dir}/${config.pageHtmlTemplate}`,
      filename: `${filename}/${config.pageHtmlTemplate}`,
      inject: true,
      showErrors: false,
    }
  })
}

const htmls = genHtmlPlugin()

module.exports = {
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        return [htmls[0]]
      })
    if (!modeDev) {
      config
        .plugin('extract-css')
        .tap(() => {
          return [{
            filename: '[name]/css/[name].[contenthash].css',
            chunkFilename: '[name]/css/[name].[contenthash].css',
          }]
        })
    }
  },
  configureWebpack: config => {
    config.entry = genEntryPath()

    const plugins = [...htmls.slice(1).map(e => new HtmlWebpackPlugin(e))]
    if (process.env.NODE_ENV === 'development') {
      config.output = {
        publicPath: '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
      }
    } else {
      config.output = {
        publicPath: '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name]/js/[hash].js',
        chunkFilename: '[name]/js/[id].[hash].js',
      }
    }
    return {
      plugins, 
    }
  },
}
