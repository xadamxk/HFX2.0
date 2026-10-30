const path = require("path");
import { Configuration } from "webpack";
const CopyPlugin = require("copy-webpack-plugin");
import { OptionsBuilderPlugin } from "./OptionsBuilderPlugin";

const baseConfig: Configuration = {
  entry: {
    main: "./src/main.ts",
    serviceWorker: "./src/service-worker.ts",
    "options-react": "./src/configuration/components/options-react.tsx",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../dist"),
    // delete old build files
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`.
      // Compile only: type errors are caught by `npm run typecheck` (and CI), not the build
      {
        test: /\.([cm]?ts|tsx)$/,
        loader: "ts-loader",
        options: { transpileOnly: true },
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/manifest.json" },
        { from: "./src/configuration/options.css", to: "options.css" },
        { from: "./src/assets", to: "assets" },
      ],
    }),
    // Build options HTML
    new OptionsBuilderPlugin({
      title: "HFX Settings",
    }),
  ],
};

export default baseConfig;
