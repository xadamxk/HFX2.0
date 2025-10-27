const { merge } = require("webpack-merge");
const ExtReloader = require("@reorx/webpack-ext-reloader");

import baseConfig from "./webpack.common";

const config = merge(baseConfig, {
  watch: true,
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
    new ExtReloader({
      reloadPage: true, // reload the active, content-script injected, tab when the extension is reloaded
      entries: {
        contentScript: "main",
        background: "serviceWorker",
      },
    }),
  ],
});

export default config;
