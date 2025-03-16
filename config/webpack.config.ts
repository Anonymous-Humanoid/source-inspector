import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

// Non-secret env vars are defined in nodemon config
const NODE_ENV = process.env.NODE_ENV;
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
const DIRNAME = path.join(__dirname, '..');

// Verifying node env
if (NODE_ENV == null) {
    throw new Error('Node environment must be specified');
}

const IS_DEV_MODE = process.env.NODE_ENV !== 'production';

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

// Copying icons
const VALID_SIZES = [16, 24, 32, 48, 56, 64, 96, 128].map((size) => size.toString());
let iconFileNames: { [size: string]: string } = {};

VALID_SIZES.forEach((size) => {
    iconFileNames[size] = `icon-${size}.png`;
});

// Initializing webpack config
let config: webpack.Configuration = {
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
                '.cjs', '.mjs',
                '.js', '.jsx',
                '.css'
            ]),
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
        
        // TODO Separate outputs into different folders (HtmlWebpackPlugin filename supports subdirectories)
        ...(Object.values(iconFileNames).map((filename) => new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(DIRNAME, 'src', 'assets', 'img', filename),
                    to: path.join(DIRNAME, OUTPUT_DIR),
                    force: true,
                }
            ]
        }))),
        
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
                                    default_icon: iconFileNames
                                },
                                icons: iconFileNames
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

// Module exports must be immutable
const FINAL_CONFIG = config;

// Webpack >= 2.0.0 no longer allows custom properties in configuration
export default FINAL_CONFIG;
