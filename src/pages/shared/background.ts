/**
 * The regex to determine if a URI belongs to a Chromium extension
 */
export const EXTENSION_URI_REGEX = /^chrome-extension:\/\//i;

/**
 * If the extension has permissions to inject into
 * the given URI, returns `true`, otherwise `false`
 * @param uri The URI to test
 * @returns
 */
export async function testInjectionUri(uri: string): Promise<boolean> {
    // Note: Chrome also allows injections into ftp:// URIs
    if (
        (await chrome.extension.isAllowedFileSchemeAccess()) &&
        /^file:\/\//i.test(uri)
    ) {
        return true;
    }

    // Not possible to detect if a page is our own
    // extension without external messaging
    // Manifest requirements: "optional_permissions": [ "tabs", "management" ]
    return /^https?:\/\//i.test(uri);
}

/**
 * Returns the active tab ID, or `undefined` if none
 * @returns The last active tab ID
 */
export async function getActiveTabId(): Promise<number | undefined> {
    let [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });

    return tab.id;
}
