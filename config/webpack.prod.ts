const { merge } = require("webpack-merge");

import baseConfig from "./webpack.common";

const config = merge(baseConfig, {
  mode: "production",
  devtool: "source-map",
});

export default config;
