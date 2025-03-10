// CommonJS module: Cannot use import here
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const { resolve } = require('path');

/** @type {webpack.Configuration} */
const config = require('./webpack.config.cjs');
const compiler = webpack(config);
const OUTPUT_DIR = /** @type {string} */ (process.env.OUTPUT_DIR);

// Enabling server-side (and disabling client-side) hot reloading
let server = new WebpackDevServer(
    {
        hot: false,
        liveReload: false,
        client: false,
        webSocketServer: false,
        bonjour: false,
        static: {
            directory: resolve(process.cwd(), OUTPUT_DIR)
        },
        devMiddleware: {
            writeToDisk: true
        }
    },
    compiler
);

// Starting server (await blocks program termination)
(async () => {
    await server.start();
})();
