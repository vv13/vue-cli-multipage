const path = require("path");
const glob = require("glob");
const fs = require("fs");

const config = {
  entry: "main.js",
  html: "index.html",
  pattern: ["src/pages/*"]
};

const genPages = () => {
  const pages = {};
  const pageEntries = config.pattern.map(e => {
    const matches = glob.sync(path.resolve(__dirname, e));
    return matches.filter(match => fs.existsSync(`${match}/${config.entry}`));
  });
  Array.prototype.concat.apply([], pageEntries).forEach(dir => {
    const filename = dir.split(path.sep).pop();
    pages[filename] = {
      entry: `${dir}/${config.entry}`,
      template: `${dir}/${config.html}`,
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
    Object.keys(pages).forEach(entryName => {
      config.plugins.delete(`prefetch-${entryName}`);
    });
    if (process.env.NODE_ENV === "production") {
      config.plugin("extract-css").tap(() => [
        {
          filename: "[name]/css/[name].[contenthash:8].css",
          chunkFilename: "[name]/css/[name].[contenthash:8].css"
        }
      ]);
    }
  },
  configureWebpack: config => {
    if (process.env.NODE_ENV === "production") {
      config.output = {
        path: path.join(__dirname, "./dist"),
        filename: "[name]/js/[name].[contenthash:8].js",
        publicPath: "/",
        chunkFilename: "[name]/js/[name].[contenthash:8].js"
      };
    }
  }
};
