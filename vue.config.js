const path = require('path')
const glob = require('glob')
const fs = require('fs')

const config = {
  pageEntry: 'main.js',
  pagePatter: ['src/pages/*'],
  pageHtmlTemplate: 'index.html',
}

const modeDev = process.env.NODE_ENV === 'development'

const genPages = () => {
  const pages = {}
  config.pagePatter.map((e) => glob.sync(path.resolve(__dirname, e))).forEach((matches) => {
    matches.forEach((dir) => {
      if (!fs.existsSync(`${dir}/${config.pageEntry}`)) return
      const prefix = 'pages/'
      const filename = dir.slice(dir.indexOf(prefix) + prefix.length)
      pages[filename] = {
        entry: `${dir}/${config.pageEntry}`,
        template: `${dir}/${config.pageHtmlTemplate}`,
        filename: `${filename}/${config.pageHtmlTemplate}`,
      }
    })
  })
  return pages
}

module.exports = {
  pages: genPages(),
}
