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
        use: "ts-loader",
        exclude: /node_modules/,
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
