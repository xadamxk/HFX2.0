const path = require("path");
import { Configuration as WebpackConfiguration } from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
import { OptionsBuilderPlugin } from "./OptionsBuilderPlugin";

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration & { progress?: boolean };
}

const baseConfig: Configuration = {
  entry: {
    main: "./src/main.ts",
    serviceWorker: "./src/service-worker.ts",
    "options-react": "./src/configuration/components/options-react.tsx",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../dist"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
    ],
  },
  plugins: [
    // delete old build files
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json" },
        { from: "./src/configuration/options.css", to: "options.css" },
        // TODO: assets and other dependencies used throughout features
      ],
    }),
    // Build options HTML
    new OptionsBuilderPlugin({
      title: "HFX Settings",
    }),
  ],
};

export default baseConfig;
