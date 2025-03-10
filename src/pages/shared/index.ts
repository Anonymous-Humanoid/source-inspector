/**
 * `true` when the extension is run in production mode, `false` otherwise
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Raised when an assertion fails
 * @see {@link assert}
 */
export class AssertionError extends Error {
    /**
     * @param msg The error message
     */
    constructor(msg?: string) {
        super(msg ?? 'Assertion failed');
    }
}

// TODO Replace assert with node:assert.assert
/**
 * Throws an {@link AssertionError} if the given expression is falsey
 * @param expr
 * @param msg
 */
export function assert(expr: boolean, msg?: string): asserts expr is true {
    if (!expr) {
        throw new AssertionError(msg);
    }
}

/**
 * Returns a promise that resolves when the given time has passed
 * @param sec The time to sleep in milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Queries the given element and its child tree based on the given xpath
 * @param xpath
 * @param parent
 * @param evaluator
 */
export function* xpath(
    xpath: string,
    parent: Node = document,
    evaluator: XPathEvaluatorBase = document
): Generator<Node> {
    let query = evaluator.evaluate(
        xpath,
        parent,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );

    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        let out = query.snapshotItem(i);

        if (out != null) {
            yield out;
        }
    }
}
