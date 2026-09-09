import path from 'node:path';
import { SourceMapGenerator } from 'source-map';
import { type Tap } from 'tapable';
import type {
    AssetInfo,
    Compiler,
    WebpackPluginInstance
} from 'webpack';
import sources, { type RawSourceMap } from 'webpack-sources';
import { type Manifest } from '../assets/manifest';

interface GenerateFilePluginArgs {
    target: string;
    content: string;
    assetInfo?: AssetInfo;

    /**
     * If `true`, will generate a source map alongside the file
     * @default false
     */
    sourceMap?: boolean;
}

interface InternalGenerateFilePluginArgs extends GenerateFilePluginArgs {
    source: sources.Source;
}

type GenerateManifestArgs = Omit<GenerateFilePluginArgs, 'content' | 'target'> & {
    /**
     * The manifest, in JSON
     */
    manifest: Manifest;

    /**
     * How much to indent the manifest
     */
    indents?: number;

    /**
     * @default 'manifest.json'
     */
    target?: string;
};

type CreateSourceMapArgs = {
    /**
     * The source file path
     */
    target: string;
} & ({
    /**
     * The source file's contents
     */
    content: string;

    /**
     * If provided, wraps the given source map
     */
    sourceMap?: string | RawSourceMap;
} | {
    /**
     * The source file's contents
     */
    content?: string;

    /**
     * If provided, wraps the given source map
     */
    sourceMap: string | RawSourceMap;
});

/**
 * Creates a source map for use in Webpack
 * @param options Source map configuration options
 * @see {@link https://tc39.es/ecma426/2024/#source-map-format Specification}
 */
export function createSourceMap(
    options: CreateSourceMapArgs & { content: string; }
): RawSourceMap {
    const map = new SourceMapGenerator({
        file: `${options.target}.map`
    });
    const lines = options.content.split('\n').length;

    // Adding original source
    map.setSourceContent(options.target, options.content);

    // Adding generated source mappings
    for (let i = 1; i <= lines; i++) {
        map.addMapping({
            source: options.target,
            generated: {
                line: i,
                column: 0,
            },
            original: {
                line: i,
                column: 0,
            }
        });
    }

    return map.toJSON();
}

/**
 * Creates a source that wraps a source map for use in Webpack
 * @param options Source map configuration options
 * @see {@link createSourceMap}
 */
export function createSourceMapSource(
    options: CreateSourceMapArgs
): sources.SourceMapSource {
    options.sourceMap ??= createSourceMap(options as CreateSourceMapArgs & { sourceMap: undefined; });

    return new sources.SourceMapSource(
        typeof options.sourceMap === 'string'
            ? options.sourceMap
            : JSON.stringify(options.sourceMap),
        options.target,
        options.sourceMap,
        options.content
    );
}

export default class GenerateFilePlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'GenerateFilePlugin' };
    private readonly options: InternalGenerateFilePluginArgs;

    constructor(options: GenerateFilePluginArgs) {
        this.options = {
            ...options,
            source: options.sourceMap === true
                ? createSourceMapSource({
                    target: options.target,
                    content: options.content
                })
                : new sources.RawSource(options.content)
        };
    }

    public apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            compilation.emitAsset(
                this.options.target,
                this.options.source,
                this.options.assetInfo
            );
        });

        this.options.source.updateHash = (hash: sources.HashLike) => {
            compiler.hooks.compilation.tap(this.plugin, (compilation) => {
                compilation.updateAsset(
                    this.options.target,
                    this.options.source,
                    {
                        contenthash: hash.digest().toString(),
                        ...this.options.assetInfo
                    }
                );
            });
        };
    }

    /**
     * Creates a Webpack plugin to generate a manifest file
     * @param options Plugin configuration options
     * @returns A Webpack plugin to execute this function
     */
    public static generateManifestPlugin(
        options: GenerateManifestArgs
    ): GenerateFilePlugin {
        return new GenerateFilePlugin({
            target: options.target ?? 'manifest.json',
            content: GenerateFilePlugin.stringifyManifest(
                options.manifest,
                options.indents
            ),
            assetInfo: options.assetInfo
        });
    }

    private static stringifyManifest(
        manifest: Manifest,
        tabs?: number
    ): string {
        const replacer = (key: string, value: any) => {
            // Manifest requires forward slashes in paths
            return typeof value === 'string' && path.sep !== '/'
                ? value.replaceAll(path.sep, '/')
                : value;
        };

        return JSON.stringify(manifest, replacer, tabs);
    }
}
