const path = require('path')
const glob = require('glob')

const config = {
  pageEntry: 'main.js',
  pagePatter: 'src/pages/*',
  pageHtmlTemplate: 'index.html',
}

const modeDev = process.env.NODE_ENV === 'development'

const genHtmlPlugin = () => {
  const pages = {}
  const dirs = glob.sync(path.resolve(__dirname, config.pagePatter))
  dirs.forEach((dir) => {
    const filename = path.basename(dir)
    pages[filename] = {
      entry: `${dir}/${config.pageEntry}`,
      template: `${dir}/${config.pageHtmlTemplate}`,
      filename: `${filename}/${config.pageHtmlTemplate}`,
    }
  })
  return pages
}

module.exports = {
  pages: genHtmlPlugin(),
}
