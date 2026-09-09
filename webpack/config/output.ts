import assert from 'node:assert';
import path from 'node:path';
import { PathDataChunk, type AssetInfo, type PathData } from 'webpack';

type TemplatePathFn<T extends PathData = PathData> = (
    pathData: T,
    assetInfo?: AssetInfo
) => string;

export function filenameTemplate(ext: string): TemplatePathFn<PathDataChunk> {
    // Note: Folders and files should not start with underscore: reserved by Chrome

    return (pathData) => {
        if (pathData.filename) {
            // Initial chunk
            // https://webpack.js.org/concepts/under-the-hood/#chunks
            return pathData.filename.replace(/^_+/g, '') + ext;
        }

        const filename = pathData.chunk.id?.toString() + ext;

        return filename;
    }
}

export const htmlFilenameTemplate: TemplatePathFn<PathDataChunk> = (pathData) => {
    assert.ok(pathData.filename, 'HTML chunk missing filename');

    const filepath = pathData.filename;

    // If path is /a/b/c/file.html, return c/file.html
    const filename = path.basename(filepath);
    const filedir = path.basename(path.dirname(filepath));

    console.log(pathData.filename);

    return path.join(filedir, filename);
};
