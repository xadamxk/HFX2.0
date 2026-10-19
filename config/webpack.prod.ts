const { merge } = require("webpack-merge");

import baseConfig from "./webpack.common";

const config = merge(baseConfig, {
  mode: "production",
  // No source maps in the packaged extension (they were ~1.2MB of dist/)
  devtool: false,
});

export default config;
