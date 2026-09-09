// import HtmlWebpackPlugin from 'html-webpack-plugin'
import { type Tap } from 'tapable';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import { createSourceMapSource } from './genFile';

export default class CreateHtmlSourceMapWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-create-source-map-webpack-plugin' };

    apply(compiler: Compiler) {
        // compiler.hooks.compilation.tap(this.plugin, (compilation) => {
        //     // beforeEmit needed to supersede minimization, see:
        //     // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
        //     HtmlWebpackPlugin.getHooks(
        //         compilation
        //     ).beforeEmit.tapAsync(this.plugin, (data, cb) => {
        //         compilation.emitAsset(
        //             `${data.outputName}.map`,
        //             createSourceMapSource({
        //                 content: data.html,
        //                 target: data.outputName
        //             }),
        //             { sourceFilename: data.outputName }
        //         );

        //         // Telling Webpack to move on
        //         cb(null, data);
        //     });
        // });
    }
}
