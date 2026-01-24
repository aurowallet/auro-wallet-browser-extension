const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  console.log("argv.mode:", argv.mode);
  const mode = argv.mode || "production";
  const isDev = mode === "development";
  const browser = env.BROWSER || "chrome";

  console.log("BROWSER:", env.BROWSER);
  if (browser === "firefox") {
    const mainFile = path.resolve(__dirname, "src/utils/o1jsUtils.ts");
    const ffFile = path.resolve(__dirname, "src/utils/o1jsUtils.firefox.ts");

    if (fs.existsSync(mainFile) && fs.existsSync(ffFile)) {
      const mainContent = fs.readFileSync(mainFile, "utf-8");
      const ffContent = fs.readFileSync(ffFile, "utf-8");

      const mainExports = [
        ...mainContent.matchAll(/export\s+(?:const|function)\s+(\w+)/g),
      ].map((m) => m[1]);
      const ffExports = [
        ...ffContent.matchAll(/export\s+(?:const|function)\s+(\w+)/g),
      ].map((m) => m[1]);

      const missing = mainExports.filter((name) => !ffExports.includes(name));

      if (missing.length === 0) {
        console.log("o1jsUtils.firefox.js is cover all methods.");
      } else {
        console.warn(
          "o1jsUtils.firefox.js less these methods:",
          missing.join(", ")
        );
        console.warn("please add, or Firefox will load error!");
      }
    } else if (fs.existsSync(mainFile)) {
      console.warn("Warn: can not find o1jsUtils.firefox.js!");
    }
  }

  const config = {
    mode,
    devtool: isDev ? "cheap-module-source-map" : false,
    optimization: {
      minimizer: [new TerserPlugin({ extractComments: false })],
      splitChunks: {
        chunks: "async",
        minSize: 20000,
        minRemainingSize: 0,
        maxSize: 250000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
      minimize: !isDev,
    },
    entry: {
      background: [
        "./src/background/regeneratorRuntime.ts",
        "./src/background/index.ts",
      ],
      popup: "./src/index.tsx",
      contentScript: "./src/contentScript/index.ts",
      webhook: "./src/webHook/index.ts",
      sandbox:
        browser === "firefox"
          ? "./src/sandbox/index.firefox.ts"
          : "./src/sandbox/index.ts",
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "./[name].js",
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: [
            "style-loader",
            { loader: "css-loader", options: { url: false, sourceMap: isDev } },
          ],
        },
        {
          test: /\.module\.css$/,
          use: [{ loader: "css-loader", options: { modules: true } }],
        },
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                cacheDirectory: true,
                presets: [
                  ["@babel/preset-env", { targets: "defaults" }],
                  ["@babel/preset-react", { runtime: "automatic" }],
                  "@babel/preset-typescript",
                ],
                plugins: [
                  "@babel/plugin-transform-class-properties",
                  ["@babel/plugin-transform-runtime", { regenerator: true }],
                ],
              },
            },
          ],
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              presets: [
                ["@babel/preset-env", { targets: "defaults" }],
                ["@babel/preset-react", { runtime: "automatic" }],
              ],
              plugins: [
                "@babel/plugin-transform-class-properties",
                ["@babel/plugin-transform-runtime", { regenerator: true }],
              ],
            },
          },
        },
        {
          test: /\.(png|jpe?g|svg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    plugins: getPlugins(browser),
    performance: getPerformance(),
    resolve: {
      fallback: {
        child_process: "empty",
        crypto: false,
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        buffer: require.resolve("buffer"),
      },
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
      conditionNames: ["import", "module", "browser", "default"],
    },
  };

  return config;
};

function getPerformance() {
  return {
    hints: "warning",
    maxAssetSize: 4 * 1024 * 1024,
    maxEntrypointSize: 4 * 1024 * 1024,
  };
}

function getPlugins(browser) {
  const plugins = [
    new CopyWebpackPlugin({
      patterns: [
        { from: "./public/static", to: "./" },
        { from: "./public/img", to: "./img" },
        { from: "./src/_locales", to: "./_locales" },
        { from: "./public/static/popup.html", to: "popup.html" },
      ],
    }),
    new webpack.ProvidePlugin({
      React: "react",
      Buffer: ["buffer", "Buffer"],
      process: "process/browser.js",
    }),
    new webpack.DefinePlugin({
      "process.env.BROWSER": JSON.stringify(browser),
    }),
    new webpack.NormalModuleReplacementPlugin(
      /[/\\]o1jsUtils(\.(?:js|ts))?$/,
      (resource) => {
        const replacement =
          browser === "firefox"
            ? path.resolve(__dirname, "src/utils/o1jsUtils.firefox.ts")
            : path.resolve(__dirname, "src/utils/o1jsUtils.ts");

        resource.request = replacement;
        resource.context = path.dirname(replacement);
        if (resource.createData) {
          resource.createData.resource = replacement;
        }
      }
    ),
  ];
  return plugins;
}
