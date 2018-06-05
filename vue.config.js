const path = require("path");
const glob = require("glob");
const fs = require("fs");

const config = {
  pageEntry: "main.js",
  pagePatter: ["src/pages/*"],
  pageHtmlTemplate: "index.html"
};

const modeDev = process.env.NODE_ENV === "development";

const genPages = () => {
  const pages = {};
  const pageEntries = config.pagePatter.map(e => {
    const matches = glob.sync(path.resolve(__dirname, e));
    return matches.filter(match => fs.existsSync(`${match}/${config.pageEntry}`));
  });
  Array.prototype.concat.apply([], pageEntries).forEach(dir => {
    const prefix = "pages/";
    const filename = dir.slice(dir.indexOf(prefix) + prefix.length);
    pages[filename] = {
      entry: `${dir}/${config.pageEntry}`,
      template: `${dir}/${config.pageHtmlTemplate}`,
      filename: `${filename}/${config.pageHtmlTemplate}`
    };
  });
  return pages;
};

module.exports = {
  pages: genPages()
};
