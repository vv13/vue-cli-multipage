## 前言

如果你是找一个多入口的脚手架，很抱歉并不能给你提供帮助，请直接使用[Nuxt](https://github.com/nuxt/nuxt.js)开启你的旅程。

本文主要是总结使用vue-cli配置多入口的一些经验，用于解决当你需要在单页应用中挂载不同的入口遇到的问题。

需要注意的是，在多页应用中子路由不支持history路由的形式，可以使用hash。

## 特性
- ✅ 自动生成入口，所有入口以目录的形式存放于src/pages下，并在第一层目录需包含index.html文件
- ✅ 支持嵌套路由，如在pages目录下存在/test/page1/index.html，访问路径为：/test/page1
- ✅ 根目录挂载，目录名为index会挂载到根目录下，而不是通过/index访问

## 什么是多页应用

单页应用（SPA）往往只含有包含一个主入口文件与index.html，页面间切换通过局部刷新资源来完成。而在多页应用中，我们会为每个HTML文档文件都指定好一个JS入口，这样一来当页面跳转时用户会获得一个新的HTML文档，整个页面会重新加载。

单页应用、多页应用的优劣势在此就不进行分析了，总而言之，多页架构模式暂时是无法取代的，如果尝试把几十个不关联的页面做成一个，那么开发成本会非常大的，**Not every app has to be an SPA**。

## 初始化项目

首先我们安装好vue-cli脚手架，并初始化一个默认工程：

```
$ npm i -g @vue-cli@next
$ vue create --default multi-page-demo
```

此时的目录结构为：

```
...
├── public
│   ├── favicon.ico
│   └── index.html
├── src
│   ├── App.vue
│   ├── assets
│   │   └── logo.png
│   ├── components
│   │   └── HelloWorld.vue
│   └── main.js
```

我们首先需要重构工程目录，可以基于以下或自身的需求进行考虑：

1. 通过一个pages目录来存放不同的入口，每个入口包含：index.html、main.js，pages，其中文件夹名即路由名
2. src目录下可以存放项目的通用组件和静态资源，每个入口单独管理自己独有的资源

通过以上考虑，决定将工程结果重构为：

```
...
├── public
│   └── favicon.ico
├── src
│   ├── assets
│   ├── components
│   └── pages
│       └── page1
│           ├── App.vue
│           ├── assets
│           │   └── logo.png
│           ├── components
│           │   └── HelloWorld.vue
│           ├── index.html
│           └── main.js
│       └── page2
│           ├── ...
```

更改完结构后，我们再通过vue.config.js对入口进行一下调整，保证项目正常运行：

```
// vue.config.js
const path = require("path");

module.exports = {
  chainWebpack: config => {
    config.plugin("html").tap(args => {
      args[0].template = path.join(__dirname, "./src/pages/page1/index.html");
      return args;
    });
  },
  configureWebpack: {
    entry: {
      app: path.join(__dirname, "./src/pages/page1/main.js")
    }
  }
};

```

vue.config.js是一个可选文件，用户需要自行创建，它会被`@vue/cli-service`读取。当正确添加配置后，重启一下项目，测试一下项目在改变目录结构后能否正常运行。试想一下，若照着这个思路进行配置多入口，那么首先需要删除或修改掉原有webpack配置项，然后还需添加多入口的一些插件，虽然通过脚手架对外提供的API可以实现，可是这种修改方式还不是直接修改原生构建配置更快，那么还有其他解决方法吗？

## Multi-Page模式

Vue CLI 支持多入口模式，只需要在vue.config.js中提供pages选项即可开启[多入口模式](https://cli.vuejs.org/zh/config/#pages)，我们现在将使用pages字段来重构vue.config.js：

```
module.exports = {
  pages: {
    index: {
      // page 的入口
      entry: "src/pages/page1/main.js",
      // 模板来源
      template: "src/pages/page1/index.html",
      // 在 dist/index.html 的输出
      filename: "index.html",
      // 当使用 title 选项时，
      // template 中的 title 标签需要是 <title><%= htmlWebpackPlugin.options.title %></title>
      title: "Index Page",
      // 在这个页面中包含的块，默认情况下会包含
      // 提取出来的通用 chunk 和 vendor chunk。
      chunks: ["chunk-vendors", "chunk-common", "index"]
    }
  }
};
```

配置完成后，服务依然正确访问，至此已经完成了添加多入口的基本准备工作，借助于脚手架多入口构建模式，因此需要做的工作仅剩下一个：**通过目录结构生成对应的入口配置**，也就是说，我们需要实现一个函数，函数的具体功能为：

![](http://7xp5r4.com1.z0.glb.clouddn.com/18-8-14/41944374.jpg)

以下是具体配置：

```
// vue.config.js
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
    return matches.filter(
      match =>
        fs.existsSync(`${match}/${config.entry}`) &&
        fs.existsSync(`${match}/${config.html}`)
    );
  });
  Array.prototype.concat.apply([], pageEntries).forEach(dir => {
    const filename = dir.split(path.sep).pop();
    pages[filename] = {
      entry: `${dir}/${config.entry}`,
      template: `${dir}/${config.html}`,
      filename: filename === 'index' ? config.html : `${filename}/${config.html}`
    };
  });
  return pages;
};

module.exports = {
  pages: genPages()
};

```

通过以上配置后，如果是page1的入口，则会最终在dist目录生成一个：`page1/index.html`，因此还需要设置vue.config.js中的devServer.historyApiFallback，确保任意的 404 响应都可能需要被替代为 index.html正常返回：

```
...
  devServer: {
    historyApiFallback: true,
  },
...
```

至此，我们配置工作就结束了。复制一份page1文件夹为page2，通过将App.vue内的img标签去除，然后重新启动项目，在浏览器中测试一下访问，若以上步骤没问题，那么访问/page2时，应该会出现不带logo的页面，运行`yarn build输出结构如下：

```
.
├── css
│   ├── page1.5f9ed80b.css
│   └── page2.80dc2e75.css
├── favicon.ico
├── img
│   └── logo.82b9c7a5.png
├── js
│   ├── chunk-vendors.f061f10e.js
│   ├── chunk-vendors.f061f10e.js.map
│   ├── page1.973fb73f.js
│   ├── page1.973fb73f.js.map
│   ├── page2.5e495ede.js
│   └── page2.5e495ede.js.map
├── page1
│   └── index.html
└── page2
    └── index.html
```

## 源码部分

@vue/cli-service通过判断是否传入pages参数来生成对应Webpack配置文件，让我们先来看看没有传入时的处理函数：

```
   if (!multiPageConfig) {
      // default, single page setup.
      htmlOptions.template = fs.existsSync(htmlPath)
        ? htmlPath
        : defaultHtmlPath

      webpackConfig
        .plugin('html')
          .use(HTMLPlugin, [htmlOptions])

      if (!isLegacyBundle) {
        // inject preload/prefetch to HTML
        ...
      }
    }
```

由源码可知，pages参数可用于生成三个插件：preload-plugin、prefetch-plugin、html-plugin，若不传html文件则会使用一个只空的默认html文件，而在多入口模式下，代码的逻辑也很简单，在此就不贴源码了，它会执行以下步骤：

1. 清除原有entry
2. 对pages字段的每个key做循环，解析每个入口对象的参数entry(必填)、title、template、filename、chunks
3. 通过entry字段生成webpack的entry入口
4. 通过其余参数生成对应的html-webpack-plugin，若不为传统模式，也会生成对应入口的preload插件与prefetch插件

## 局部优化

#### 移除prefetch

由于本人并不喜欢为将来做打算，因此并不希望预加载一些可能会用到的asyncChunk，因为会浪费掉一些带宽，而且在多页面中并不见得预加载其他入口的文件是一件好事情，于是我们通过chainWebpack进行删除：

```
modules.exports = {
	// ...
  chainWebpack: config => {
    Object.keys(pages).forEach(entryName => {
      config.plugins.delete(`prefetch-${entryName}`);
    });
  }
}
```

#### 关闭SourceMap

关闭之后不仅能加快生产环境的打包速度，也能避免源码暴露在浏览器端：

```
modules.exports = {
	// ...
    productionSourceMap: false,
}
```

#### 打包分类(强迫症患者福音)

首先回顾一下dist中的部分文件夹：

```
.
├── css
│   ├── page1.5f9ed80b.css
│   └── page2.80dc2e75.css
├── js
│   ├── chunk-vendors.f061f10e.js
│   ├── chunk-vendors.f061f10e.js.map
│   ├── page1.973fb73f.js
│   ├── page1.973fb73f.js.map
│   ├── page2.5e495ede.js
│   └── page2.5e495ede.js.map
├── page1
│   └── index.html
└── page2
    └── index.html
```

其实我们更希望的是不同入口的css与js文件放入不同入口中，而不是统一放在一个js和css文件夹，为了做到这一点，js打包路径我们可已通过修改webpack的output配置来完成，而css打包路径，脚手架是通过MiniCssExtractPlugin插件来完成的，因此可以使用chainWebpack的tap来修改其配置，以上只需要在生产环境修改即可：

```
modules.exports = {
  // ...
  chainWebpack: config => {
	// ...
    if (process.env.NODE_ENV === "production") {
      config.plugin("extract-css").tap(() => (() => [
        {
          filename: "[name]/css/[name].[contenthash:8].css",
          chunkFilename: "[name]/css/[name].[contenthash:8].css"
        }
      ]));
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
}
```

此时打包后的dist文件夹为：

```
├── page1
│   ├── css
│   │   └── page1.42195c95.css
│   ├── index.html
│   └── js
│       └── page1.569bf4e5.js
└── page2
    ├── css
    │   └── page2.4e7ad924.css
    ├── index.html
    └── js
        └── page2.05e51252.js
```
