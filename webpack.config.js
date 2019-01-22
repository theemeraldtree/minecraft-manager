const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');
const process = require('process');

module.exports = {
    context: __dirname + '/src',
    entry: './index.js',
    mode: 'none',
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
        }),
    ],
    target: 'electron-main',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loaders: ['babel-loader'],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: ['babel-loader', 'eslint-loader'],
            },
            {
                test: /\.(gif|svg|jpg|png)$/,
                loader: "file-loader",
            }
        ],
    },
    node: {
        __dirname: false,
        __filename: false
    },
    devServer: {
        contentBase: __dirname + '/dist',
        before() {
            spawn(
                'electron',
                ['.'],
                { shell: true, env: process.env, stdio: 'inherit' }
            ).on('close', code => process.exit(code));
        }
    },
    output: {
        filename: 'index.js',
        path: __dirname + '/bundles',
    }
}