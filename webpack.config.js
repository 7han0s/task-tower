/**
 * webpack.config.js
 * Configuration for webpack build process
 */

import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WorkboxWebpackPlugin from 'workbox-webpack-plugin';
import webpack from 'webpack';

const isProduction = process.env.NODE_ENV === 'production';

// Get the current directory
const currentDir = path.resolve();

const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const config = {
    mode: isProduction ? 'production' : 'development',
    entry: './scripts/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(currentDir, 'dist'),
        publicPath: '/',
    },
    devtool: 'inline-source-map',
    devServer: {
        static: {
            directory: path.join(currentDir, 'public'),
        },
        compress: true,
        port: 8080,
        hot: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
        },
        allowedHosts: 'all',
        client: {
            overlay: {
                errors: true,
                warnings: false
            }
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(currentDir, 'public', 'index.html'),
            filename: 'index.html',
            inject: 'body'
        }),
        new MiniCssExtractPlugin(),
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer']
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/i,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                    plugins: ['@babel/plugin-transform-runtime']
                }
            },
            {
                test: /\.css$/i,
                use: [stylesHandler, 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        fallback: {
            "fs": false,
            "path": false,
            "os": false,
            "crypto": false
        }
    },
    target: 'web'
};

if (isProduction) {
    config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());
}

export default config;
