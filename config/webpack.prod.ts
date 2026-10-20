const { merge } = require("webpack-merge");

import { DefinePlugin } from "webpack";
import baseConfig from "./webpack.common";

const config = merge(baseConfig, {
  mode: "production",
  // No source maps in the packaged extension (they were ~1.2MB of dist/)
  devtool: false,
  plugins: [new DefinePlugin({ __HFX_DEV__: JSON.stringify(false) })],
});

export default config;
