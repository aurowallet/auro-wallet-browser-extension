const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = (env, argv) => {
  console.log('argv.mode', argv.mode)
  const mode = argv.mode;
  const isDev = mode === 'development';

  const cssRegex = /\.css$/;
  const cssModuleRegex = /\.module\.css$/;
  const sassRegex = /\.(scss|sass)$/;
  const sassModuleRegex = /\.module\.(scss|sass)$/;

  const config = {
    entry: {
      background: "./src/background/index.js",
      popup: "./src/index.js",
      contentScript: "./src/contentScript/index.js",
      webhook: "./src/webHook/index.js"
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "./[name].js",
    },
    module: {
      //加载器配置
      rules: [
        {
          test: cssRegex,
          exclude: cssModuleRegex,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
              options: {
                url: false,
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: cssModuleRegex,
          use: [
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
          ]
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: "babel-loader",
        },
        {
          test: sassRegex,
          exclude: sassModuleRegex,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  modules: true,
                }
              },
            },
          ],
        },
        {
          test: sassModuleRegex,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  modules: true,
                }
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 8192,
              },
            },
          ],
        },
      ],
    },
    plugins: getPlugins(),
    resolve:{
      fallback:{
        'child_process': 'empty',
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "buffer": require.resolve("safe-buffer"),
      },
    },
  };
  if (isDev) {
    config.devtool = 'cheap-module-source-map';
    config.optimization = {
      minimize: false,
    };
  }
  return config;
}


function getPerformance() {
  return {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  };
}
function getPlugins() {
  let plugins = [];
  plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        { from: "./public/static", to: "./" },
        { from: "./public/img", to: "./img" },
        { from: "./public/manifest.json", to: "./" },
        { from: "./src/_locales", to: "./_locales" },
      ],
    }),
    new webpack.ProvidePlugin({
      React: "react",
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js', 
    })
  );
  return plugins;
}
