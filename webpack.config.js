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
        clean: true,
        assetModuleFilename: 'assets/[hash][ext][query]'
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    devServer: {
        static: {
            directory: path.join(currentDir, 'public'),
            watch: {
                ignored: /node_modules/,
            }
        },
        compress: true,
        port: 3000,
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
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
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
                test: /node_modules\/(googleapis|google-auth-library|googleapis-common)\/build\/src\//,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: ['@babel/plugin-transform-runtime']
                        }
                    },
                    {
                        loader: 'imports-loader',
                        options: {
                            additionalCode: 'var process = require("process/browser"); var global = window;'
                        }
                    }
                ]
            },
            {
                test: /node_modules\/(googleapis|google-auth-library|googleapis-common)\/build\/src\//,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            additionalCode: 'var Buffer = require("buffer").Buffer;'
                        }
                    }
                ]
            },
            {
                test: /node_modules\/@babel\/(runtime|regenerator)\//,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: ['@babel/plugin-transform-runtime']
                        }
                    }
                ]
            },
            {
                test: /node_modules\/(events|process)\//,
                use: [
                    {
                        loader: 'imports-loader',
                        options: {
                            additionalCode: 'var process = require("process/browser");'
                        }
                    }
                ]
            },
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
                type: 'asset/resource',
            }
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        fallback: {
            "fs": false,
            "path": false,
            "os": false,
            "crypto": false,
            "util": false,
            "stream": false,
            "http": false,
            "https": false,
            "zlib": false,
            "tls": false,
            "net": false,
            "dns": false,
            "child_process": false,
            "vm": false,
            "querystring": false,
            "events": false,
            "process": false
        },
        alias: {
            process: 'process/browser',
            buffer: 'buffer',
            stream: 'stream-browserify',
            crypto: 'crypto-browserify',
            assert: 'assert',
            http: 'stream-http',
            https: 'https-browserify',
            os: 'os-browserify',
            url: 'url',
            util: 'util'
        }
    },
    externals: {
        'util': 'commonjs util',
        'http2': 'commonjs http2'
    },
    target: 'web',
    node: {
        __dirname: false,
        __filename: false
    }
};

if (isProduction) {
    config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());
}

export default config;
