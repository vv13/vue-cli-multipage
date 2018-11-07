const path = require('path');
const fs = require('fs');

const config = {
  entry: 'main.js',
  html: 'index.html',
  pagesRoot: path.resolve(__dirname, 'src/pages')
};

const genRoutes = () => {
  const allRoutes = [];

  const findAllRoutes = (source, routes) => {
    const files = fs.readdirSync(source);
    files.forEach(filename => {
      const fullname = path.join(source, filename);
      const stats = fs.statSync(fullname);
      if (!stats.isDirectory()) return;
      if (fs.existsSync(`${fullname}/${config.html}`)) {
        routes.push(fullname);
      } else {
        findAllRoutes(fullname, routes);
      }
    });
  };
  findAllRoutes(config.pagesRoot, allRoutes);
  return allRoutes;
};

const genPages = () => {
  const pages = {};
  genRoutes().forEach(route => {
    const filename = route.split('pages/').pop();
    pages[filename] = {
      entry: `${route}/${config.entry}`,
      template: `${route}/${config.html}`,
      filename: `${filename}/${config.html}`
    };
  });
  return pages;
};

const pages = genPages();

module.exports = {
  productionSourceMap: false,
  pages,
  chainWebpack: config => {
    // remove prefetch, use import(/* webpackPrefetch: true */ './someAsyncComponent.vue')
    Object.keys(pages).forEach(entryName => {
      config.plugins.delete(`prefetch-${entryName}`);
    });
    if (process.env.NODE_ENV === 'production') {
      config.plugin('extract-css').tap(() => [
        {
          filename: '[name]/css/[name].[contenthash:8].css',
          chunkFilename: '[name]/css/[name].[contenthash:8].css'
        }
      ]);
    }
  },
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.output = {
        path: path.join(__dirname, './dist'),
        filename: '[name]/js/[name].[contenthash:8].js',
        publicPath: '/',
        chunkFilename: '[name]/js/[name].[contenthash:8].js'
      };
    }
  }
};
