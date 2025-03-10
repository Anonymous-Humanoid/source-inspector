// CommonJS module: Cannot use import here
const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

// Non-secret env vars are defined in nodemon config
const NODE_ENV = process.env.NODE_ENV;
const OUTPUT_DIR = /** @type {string} */ (process.env.OUTPUT_DIR);
const DIRNAME = path.join(__dirname, '..');

// Verifying node env
if (NODE_ENV == null) {
    throw new Error('Node environment must be specified');
}

// Configuring webpack
const FILE_EXTS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'eot',
    'otf',
    'svg',
    'ttf',
    'woff',
    'woff2',
];

const IS_DEV_MODE = process.env.NODE_ENV !== 'production';

/** @type {webpack.Configuration} */
let config = {
    mode: IS_DEV_MODE ? 'development' : 'production',
    devtool: IS_DEV_MODE ? 'cheap-module-source-map' : undefined,
    optimization: IS_DEV_MODE ? undefined : {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false
            })
        ]
    },
    entry: {
        background: path.join(DIRNAME, 'src', 'pages', 'background', 'index.ts'),
        docListener: path.join(DIRNAME, 'src', 'pages', 'popup', 'docListener.ts'),
        popup: path.join(DIRNAME, 'src', 'pages', 'popup', 'index.tsx')
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(DIRNAME, OUTPUT_DIR),
        clean: true,
        publicPath: process.env.ASSET_PATH
    },
    resolve: {
        extensions: FILE_EXTS
            .map((extension) => '.' + extension)
            .concat([
                '.ts', '.tsx', // TS/TSX must come before JS/JSX
                '.js', '.jsx', '.css']),
    },
    devServer: {
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.(css|scss|sass)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: new RegExp('.(' + FILE_EXTS.join('|') + ')$'),
                type: 'asset/resource',
                /*
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]'
                },
                */
                exclude: /node_modules/
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/
            },
            {
                // TS/TSX must come before JS/JSX
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            transpileOnly: IS_DEV_MODE
                        }
                    }
                ]
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'source-map-loader'
                    },
                    {
                        loader: require.resolve('babel-loader'),
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({ verbose: false }),
        new webpack.ProgressPlugin(),
        
        // TODO Separate outputs into different folders (filename supports subdirectories)
        new HtmlWebpackPlugin({
            template: path.join(DIRNAME, 'src', 'pages', 'popup', 'index.html'),
            filename: 'popup.html',
            chunks: ['popup'],
            cache: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(DIRNAME, 'src', 'manifest.json'),
                    to: path.join(DIRNAME, OUTPUT_DIR),
                    force: true,
                    transform: (content, path) => {
                        // Generating the manifest file using env information
                        let template = JSON.parse(content.toString());
                        
                        return Buffer.from(
                            JSON.stringify({
                                ...template,
                                name: process.env.PACKAGE_NAME,
                                description: process.env.PACKAGE_DESCRIPTION,
                                action: {
                                    default_icon: icons
                                },
                                icons
                            })
                        );
                    }
                }
            ]
        })
    ].filter(Boolean),
    infrastructureLogging: {
        level: 'info',
    }
};

// Copying icons
const VALID_SIZES = [16, 24, 32, 48, 56, 64, 96, 128];
let icons = {};

if (config.plugins == null) {
    config.plugins = [];
}

for (let s of VALID_SIZES) {
    let size = s.toString();
    let filename = `icon-${size}.jpeg`;

    icons[size] = filename;

    config.plugins.push(
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(DIRNAME, 'src', 'assets', 'img', filename),
                    to: path.join(DIRNAME, OUTPUT_DIR),
                    force: true,
                }
            ]
        })
    );
}

// Webpack >= 2.0.0 no longer allows custom properties in configuration
const FINAL_CONFIG = config;

module.exports = FINAL_CONFIG;
