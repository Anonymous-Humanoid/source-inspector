// Temporary fix for https://github.com/DefinitelyTyped/DefinitelyTyped/pull/72170
declare namespace chrome {
    /**
     * Use the `chrome.dom` API to access special DOM APIs for Extensions
     * @since Chrome 88
     */
    export namespace dom {
        /**
         * @since Chrome 88
         * Requests chrome to return the open/closed shadow roots else return null.
         * @param element reference of HTMLElement.
         */
        export function openOrClosedShadowRoot(element: HTMLElement): ShadowRoot | null;
    }
}
