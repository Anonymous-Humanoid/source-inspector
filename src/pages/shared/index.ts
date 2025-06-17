/**
 * `true` when the extension is run in production mode, `false` otherwise
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Returns a promise that resolves when the given time has passed
 * @param sec The time to sleep in milliseconds
 */
export function sleep(ms: Readonly<number>): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Queries the given element and its child tree based on the given xpath
 * @param xpath
 * @param parent
 * @param evaluator
 */
export function* xpath(
    xpath: Readonly<string>,
    parent: Readonly<Node> = document,
    evaluator: Readonly<XPathEvaluatorBase> = document
): Generator<Node> {
    const query = evaluator.evaluate(
        xpath,
        parent,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        const out = query.snapshotItem(i);

        if (out != null) {
            yield out;
        }
    }
}
