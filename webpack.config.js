/* i have no idea what the heck im doing here */

import path from "node:path";
import { fileURLToPath } from "url";

const outdir = path.dirname(fileURLToPath(import.meta.url));

export default {
  mode: "development",
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
              plugins: [
                "babel-plugin-react-compiler",
              ],
            },
          },
          "ts-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "sailresults.js",
    path: path.resolve(outdir, "out"),
  }
};
