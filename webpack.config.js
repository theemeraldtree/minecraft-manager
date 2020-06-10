const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');
const process = require('process');
const path = require('path');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return ({
    context: `${__dirname}/src`,
    entry: './index.js',
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: isDev ? [
      new HtmlWebpackPlugin({
        template: './index.html'
      })
    ] : [new HtmlWebpackPlugin({ template: './index.html' })],
    devtool: isDev ? 'cheap-module-eval-source-map' : 'none',
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
      before() {
        spawn('electron', ['.'], {
          shell: true,
          env: process.env,
          stdio: 'inherit'
        }).on('close', code => process.exit(code));
      },
      stats: {
        warningsFilter: [
          'Can\'t resolve \'fsevents\''
        ] // Disables the Chokidar fsevents warning on non-macOS systems
      },
    },
    output: {
      filename: 'index.js',
      path: `${__dirname}/bundles`
    }
  });
};
