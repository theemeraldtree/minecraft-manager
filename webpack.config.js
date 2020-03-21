const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');
const process = require('process');
const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: `${__dirname}/src`,
  entry: ['babel-polyfill', './index.js'],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'react-dom': '@hot-loader/react-dom'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  devtool: 'cheap-module-eval-source-map',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.(css)$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: ['babel-loader', 'eslint-loader']
      },
      {
        test: /\.(gif|svg|jpg|png)$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'file-loader'
      },
      {
        test: /\.txt$/i,
        exclude: /node_modules/,
        loader: 'raw-loader'
      },
      {
        test: /\.(ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          outputPath: 'src/font'
        }
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  devServer: {
    contentBase: './',
    hot: true,
    before() {
      spawn('electron', ['.'], {
        shell: true,
        env: process.env,
        stdio: 'inherit'
      }).on('close', code => process.exit(code));
    }
  },
  output: {
    filename: 'index.js',
    path: `${__dirname}/bundles`
  }
};
