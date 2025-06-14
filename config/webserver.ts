import { resolve } from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import config from './webpack.config';

const compiler = webpack(config);
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
const WEBPACK_PORT = process.env.WEBPACK_PORT!;

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
        },
        port: WEBPACK_PORT
    },
    compiler
);

// Starting server (await blocks program termination)
(async () => {
    await server.start();
})();
