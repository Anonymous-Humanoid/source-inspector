import assert from 'node:assert/strict';
import path from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import * as config from './config';
import {
    IS_DEV_MODE,
    OUTPUT_ABS_DIR,
    PROJECT_ROOT
} from './env';

// Initializing webpack config
const webpackConfig: webpack.Configuration = {
    context: PROJECT_ROOT,
    mode: IS_DEV_MODE ? 'development' : 'production',
    experiments: {
        html: true,
        css: false, // Can't use with css-loader or style-loader
        //futureDefaults: true // For testing
    },
    // Extensions cannot use eval
    devtool: IS_DEV_MODE
        ? 'hidden-cheap-module-source-map'
        : 'hidden-source-map',
    optimization: IS_DEV_MODE
        ? undefined
        : {
              minimize: true,
              minimizer: [
                  new TerserPlugin({
                      extractComments: false,
                      minimizerOptions: {
                          sourceMap: true
                      }
                  })
              ]
          },
    entry: {
        content: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'content',
                    'docListener.ts'
                )
            ],
            filename: path.join('content', 'docListener.js')
        },
        popup: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'popup',
                    'index.html'
                ),
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'popup',
                    'index.tsx'
                ),
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'popup',
                    'index.scss'
                )
            ]
        },
        background: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'background',
                    'index.ts'
                )
            ],
            filename: path.join('background', 'index.js')
        },
        options: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'options',
                    'index.html'
                ),
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'options',
                    'index.tsx'
                ),
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'options',
                    'index.scss'
                )
            ]
        }
    },
    output: {
        path: OUTPUT_ABS_DIR,
        clean: true,
        publicPath: '/',
        iife: true,
        htmlFilename: config.output.htmlFilenameTemplate,
        htmlChunkFilename: config.output.filenameTemplate('.html'),
        cssFilename: config.output.filenameTemplate('.css'),
        cssChunkFilename: config.output.filenameTemplate('.css'),
        filename: config.output.filenameTemplate('.js'),
        chunkFilename: config.output.filenameTemplate('.js')
    },
    resolve: {
        extensions: [
            ...config.assets.resolveExts,
            ...config.js.resolveExts, // JS before CSS for index import conflicts
            ...config.css.resolveExts,
        ]
    },
    module: {
        rules: [
            ...config.assets.moduleRules,
            ...config.css.moduleRules,
            ...config.js.moduleRules,
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        ...config.assets.plugins,
        ...config.css.plugins,
        ...config.js.plugins,
    ],
    watchOptions: {
        // https://npmjs.com/package/fork-ts-checker-webpack-plugin#installation
        ignored: ['node_modules']
    },
    infrastructureLogging: {
        level: 'info'
    },
    stats: 'errors-warnings'
};

export default webpackConfig;
