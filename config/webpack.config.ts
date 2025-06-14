import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

// Must use require for now: the types package is behind our current Webpack version
const GenerateJsonPlugin = require('generate-json-webpack-plugin');

// Non-secret env vars are defined in nodemon config
const NODE_ENV = process.env.NODE_ENV;
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
const DIRNAME = path.join(__dirname, '..');

// Verifying node env
if (NODE_ENV == null) {
    throw new Error('Node environment must be specified');
}

const IS_DEV_MODE = process.env.NODE_ENV !== 'production';

// Copying icons
const VALID_SIZES = [16, 32, 48, 128].map((size) => size.toString());
const relativeIconPaths = [
    ...new Map<string, [string, string]>(
        VALID_SIZES.map((size) => [
            size,
            [
                `${NODE_ENV}-icon-${size}.png`, // Input
                path.join('icons', `icon-${size}.png`) // Output
            ]
        ])
    ).entries()
];

// Generating manifest file
const BACKGROUND_OUTPUT_PATH = path.join('background', 'index.js');
const manifestIconPaths: { [size: string]: string } = {};

relativeIconPaths.forEach(([size, [inputPath, outputPath]]) => {
    manifestIconPaths[size] = outputPath;
});

const MANIFEST: chrome.runtime.ManifestV3 = {
    manifest_version: 3,
    name: process.env.PACKAGE_NAME!,
    description: process.env.PACKAGE_DESCRIPTION!,
    version: '1.0.0',
    homepage_url: 'https://github.com/Anonymous-Humanoid/source-inspector',
    author: {
        email: 'ninth-blast-royal@duck.com'
    },
    minimum_chrome_version: '93',
    permissions: ['scripting', 'activeTab'],
    incognito: 'split',
    background: {
        service_worker: BACKGROUND_OUTPUT_PATH
    },
    action: {
        default_icon: manifestIconPaths
    },
    icons: manifestIconPaths
};

// Initializing webpack config
const STATIC_FILE_EXTS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'eot',
    'otf',
    'svg',
    'ttf',
    'woff',
    'woff2'
];
const CONFIG: webpack.Configuration = {
    mode: IS_DEV_MODE ? 'development' : 'production',
    devtool: IS_DEV_MODE ? 'cheap-module-source-map' : undefined,
    optimization: IS_DEV_MODE
        ? undefined
        : {
              minimize: true,
              minimizer: [
                  new TerserPlugin({
                      extractComments: false
                  })
              ]
          },
    entry: {
        // Popup
        docListener: {
            import: [
                path.join(DIRNAME, 'src', 'pages', 'popup', 'docListener.ts')
            ],
            filename: path.join('popup', 'docListener.js')
        },
        popup: {
            import: [path.join(DIRNAME, 'src', 'pages', 'popup', 'index.tsx')],
            filename: path.join('popup', 'index.js').replaceAll('\\', '/') // HTMLWebpackPlugin requires forward slashes
        },

        // Background
        background: {
            import: [
                path.join(DIRNAME, 'src', 'pages', 'background', 'index.ts')
            ],
            filename: BACKGROUND_OUTPUT_PATH
        }
    },
    output: {
        filename: '[name].bundle.js', // Extra clarification that paths change on build
        path: path.resolve(DIRNAME, OUTPUT_DIR),
        clean: true,
        publicPath: process.env.ASSET_PATH
    },
    resolve: {
        extensions: STATIC_FILE_EXTS.map((extension) => '.' + extension).concat(
            [
                '.ts',
                '.tsx', // TS/TSX must come before JS/JSX
                '.cjs',
                '.mjs', // CJS/MJS before JS
                '.js',
                '.jsx',
                '.css'
            ]
        )
    },
    module: {
        rules: [
            // Static files
            {
                test: new RegExp('.(' + STATIC_FILE_EXTS.join('|') + ')$'),
                type: 'asset/resource',
                exclude: /node_modules/
            },

            // CSS/SCSS/SASS
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

            // HTML
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/
            },

            // TS/TSX (must come before JS/JSX)
            {
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

            // CJS/MJS/JS/JSX
            {
                test: /\.(cjs|mjs|js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'source-map-loader'
                    }
                ]
            }
        ]
    },
    plugins: [
        // Setting up fresh Webpack environment
        new CleanWebpackPlugin({ verbose: false }),
        new webpack.ProgressPlugin(),

        // Packaging icons
        ...relativeIconPaths.map(([size, [inputPath, outputPath]]) => {
            return new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(
                            DIRNAME,
                            'src',
                            'assets',
                            'icons',
                            inputPath
                        ),
                        to: path.join(DIRNAME, OUTPUT_DIR, outputPath),
                        force: true
                    }
                ]
            });
        }),

        // Packaging popup entry point
        new HtmlWebpackPlugin({
            template: path.join(DIRNAME, 'src', 'pages', 'popup', 'index.html'),
            filename: path.join(DIRNAME, OUTPUT_DIR, 'popup', 'index.html'),
            chunks: ['popup'],
            cache: false
        }),

        // Generating manifest file
        new GenerateJsonPlugin(
            'manifest.json',
            MANIFEST,
            (key: string, value: any) => {
                // Manifest requires forward slashes
                return typeof value === 'string'
                    ? value.replaceAll('\\', '/')
                    : value;
            },
            IS_DEV_MODE ? 4 : null // Setting tabbing for readability
        )
    ].filter(Boolean),
    infrastructureLogging: {
        level: 'info'
    }
};

// Webpack >= 2.0.0 no longer allows custom properties in configuration
export default CONFIG;
