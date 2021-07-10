const TerserPlugin = require("terser-webpack-plugin");
const isProd = process.env.NODE_ENV === "production";
// Removal of console log and comments on production build only.
module.exports = {
  configureWebpack: {
    optimization: {
      minimize: true,
      minimizer: isProd
        ? [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                },
                output: {
                  comments: false,
                },
              },
            }),
          ]
        : [],
    },
  },
};
