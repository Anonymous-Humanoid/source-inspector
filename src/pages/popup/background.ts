import { testInjectionUri } from '../shared/background';
import { ConnectMsg } from './msgs';

// Shared exports
export const TIMEOUT_MS = 5_000;

class Popup {
    #popupId: number | undefined;
    #tabId: number | undefined;

    #tryConnecting(): void {
        if (this.#popupId != null && this.#tabId != null) {
            console.log('Connecting popup to tab');

            const msg: ConnectMsg = {
                type: 'connection',
                tabId: this.#tabId
            };

            chrome.tabs.sendMessage(this.#popupId, msg);
        }
    }

    /**
     * Allows the inspected tab to connect,
     * allowing document changes to be communicated
     * @param tabId
     * @param popupId
     */
    #initializeTabBroker(tabId: number): void {
        const self = this;

        // Waiting for document listener to initialize
        async function MSG_BROKER(
            _msg: Readonly<any>,
            sender: Readonly<chrome.runtime.MessageSender>
        ): Promise<void> {
            if (sender.id === chrome.runtime.id && sender.tab?.id === tabId) {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);
                clearTimeout(TIMEOUT);

                console.log(`Tab ${tabId} successfully initialized`);

                self.#tabId = tabId;

                self.#tryConnecting();
            }
        }

        // Ensuring garbage collection after fixed timeout
        const TIMEOUT = setTimeout(() => {
            chrome.runtime.onMessage.removeListener(MSG_BROKER);

            console.error(
                `Tab ${tabId} failed to connect within ${TIMEOUT_MS}ms`
            );
        }, TIMEOUT_MS);

        chrome.runtime.onMessage.addListener(MSG_BROKER);

        // Injecting document listener into tab
        chrome.scripting.executeScript({
            target: {
                tabId
                // allFrames: true
            },
            files: ['popup/docListener.js'],
            world: 'ISOLATED'
        });
    }

    /**
     * Allows the inspector popup to connect,
     * allowing document changes to be
     * communicated to the inspected tab
     * @param popupId
     * @param popupId
     */
    async #initializePopupBroker(): Promise<void> {
        const self = this;

        // Waiting for popup to initialize
        async function MSG_BROKER(
            _msg: Readonly<any>,
            sender: Readonly<chrome.runtime.MessageSender>
        ): Promise<void> {
            if (
                sender.id === chrome.runtime.id &&
                sender.tab?.id === POPUP_ID
            ) {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);
                clearTimeout(TIMEOUT);

                console.log(`Popup ${POPUP_ID} successfully initialized`);

                self.#popupId = POPUP_ID;

                self.#tryConnecting();
            }
        }

        chrome.runtime.onMessage.addListener(MSG_BROKER);

        // Opening popup (requires extension split to run in incognito)
        const popup = await chrome.windows.create({
            url: chrome.runtime.getURL('popup/index.html'),
            type: 'popup'
        });
        const POPUP_ID = popup.tabs![0].id!;

        // Ensuring garbage collection after fixed timeout
        const TIMEOUT = setTimeout(() => {
            chrome.runtime.onMessage.removeListener(MSG_BROKER);

            console.error(
                `Popup ${POPUP_ID} failed to connect within ${TIMEOUT_MS}ms`
            );
        }, TIMEOUT_MS);
    }

    /**
     * Initializes the popup to inspect the given tab's document source
     * @param tab
     */
    static async tryCreatingPopup(tab: chrome.tabs.Tab): Promise<void> {
        if (
            tab.id != null &&
            tab.url != null &&
            (await testInjectionUri(tab.url))
        ) {
            const popup = new Popup();

            popup.#initializePopupBroker();
            popup.#initializeTabBroker(tab.id);
        }
    }

    /**
     * Creates a document source inspector popup
     * in a new tab when the extension icon is clicked
     */
    static registerPopup(): void {
        chrome.action.onClicked.addListener(Popup.tryCreatingPopup);
    }
}

export default Popup.registerPopup;
