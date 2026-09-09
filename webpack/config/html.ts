import { LICENSE } from '../assets/license';
import {
    CreateHtmlSourceMapWebpackPlugin,
    HtmlBannerWebpackPlugin
} from '../plugins';

export const plugins = [
    // Manually creating (unlinked) source map
    new CreateHtmlSourceMapWebpackPlugin(),

    // Embedding license information after minimization
    new HtmlBannerWebpackPlugin({
        banner: LICENSE,
        sourceMap: true
    }),
];
