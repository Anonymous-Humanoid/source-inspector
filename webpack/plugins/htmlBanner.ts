// import HtmlWebpackPlugin from 'html-webpack-plugin';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { type Tap } from 'tapable';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import { type RawSourceMap } from 'webpack-sources';
import { createSourceMapSource } from './genFile';

interface HtmlBannerWebpackPluginArgs {
    /**
     * The text to be appended to the file
     */
    banner: string;

    /**
     * If `true`, banner will be placed at the end of the output.
     * @default false
     */
    footer?: boolean;

    /**
     * If `true`, defers formatting to the user.
     * Otherwise, formats the banner as a block comment.
     * @default false
     */
    raw?: boolean;

    /**
     * If `true`, updates the associated source maps
     * @default false
     */
    sourceMap?: boolean;
}

export default class HtmlBannerWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-banner-webpack-plugin' };
    private readonly options: HtmlBannerWebpackPluginArgs;

    constructor(options: HtmlBannerWebpackPluginArgs) {
        this.options = {
            ...options,
            footer: options.footer ?? false
        };

        if (!options.raw) {
            const safeBanner = options.banner.replaceAll('-->', '-- >');
            this.options.banner = `<!--\n${safeBanner}\n-->`;
        }
    }

    apply(compiler: Compiler) {
        // compiler.hooks.compilation.tap(this.plugin, (compilation) => {
        //     // beforeEmit needed to supersede minimization, see:
        //     // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
        //     HtmlWebpackPlugin.getCompilationHooks(
        //         compilation
        //     ).beforeEmit.tapAsync(this.plugin, async (data, cb) => {
        //         if (this.options.footer) {
        //             const banner = '\n' + this.options.banner;

        //             data.html += banner;
        //         }
        //         else {
        //             data.html = `${this.options.banner}\n${data.html}`;

        //             if (this.options.sourceMap === true) {
        //                 const lines = this.options.banner.split('\n').length;

        //                 for (const [name, oldSource] of Object.entries(compilation.assets)) {
        //                     if (!name.endsWith('.html.map')) {
        //                         continue;
        //                     }

        //                     const rawSourceMap: RawSourceMap = JSON.parse(oldSource.source().toString());
        //                     // https://github.com/mozilla/source-map#sourcemapconsumerinitializeoptions
        //                     const consumer = await new SourceMapConsumer(rawSourceMap);
        //                     const tmpSourceMap = new SourceMapGenerator();

        //                     consumer.eachMapping((mapping) => {
        //                         tmpSourceMap.addMapping({
        //                             source: mapping.source,
        //                             name: mapping.name,
        //                             original: {
        //                                 line: mapping.originalLine,
        //                                 column: mapping.originalColumn
        //                             },
        //                             generated: {
        //                                 line: mapping.originalLine + lines,
        //                                 column: mapping.originalColumn
        //                             }
        //                         });
        //                     });

        //                     const sourceMap = SourceMapGenerator.fromSourceMap(consumer).toJSON();

        //                     consumer.destroy();

        //                     sourceMap.mappings = tmpSourceMap.toJSON().mappings;

        //                     const newSource = createSourceMapSource({
        //                         target: name,
        //                         sourceMap: sourceMap
        //                     });

        //                     compilation.updateAsset(name, newSource);
        //                 }
        //             }
        //         }

        //         // Telling Webpack to move on
        //         cb(null, data);
        //     });
        // });
    }
}
