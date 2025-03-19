import { Mutex, MutexInterface } from 'async-mutex';
import { v4 as uuid } from 'uuid';
import {
    PopupMsg,
    ReceivedMsg,
    RemoveMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg
} from './msgs';

interface PartialNodeMutationRecord {
    readonly type: 'childList';
    readonly target?: Node | null;
    readonly addedNodes: NodeList | Node[];
    readonly removedNodes: NodeList | Node[];
    readonly previousSibling?: Node | null;
}

interface PartialAttributeMutationRecord {
    readonly type: 'attributes';
    readonly target: Node;
}

interface PartialCharacterDataMutationRecord {
    readonly type: 'characterData';
    readonly target: Node;
}

type PartialMutationRecord =
    | PartialNodeMutationRecord
    | PartialAttributeMutationRecord
    | PartialCharacterDataMutationRecord;

/**
 * A document source inspector. Communicates document
 * updates to a popup without invoking DevTools, thereby
 * circumventing most site interference detection
 */
(async () => {
    const msgMutex = new Mutex();

    let _mutexRelease: MutexInterface.Releaser | undefined;
    let _connection: chrome.runtime.Port | undefined;
    let _observer: MutationObserver | undefined;
    let _elementMap = new WeakMap<Node, string>();
    let _initialDomConstructed = false;
    let _mutationCache = new Array<PartialMutationRecord>();

    /**
     * Acquires the messaging mutex, forcing synchronous
     * messaging in an otherwise asynchronous context.
     */
    async function _acquireMsgMutex() {
        _mutexRelease = await msgMutex.acquire();
    }

    /**
     * Releases the messaging mutex,
     * allowing synchronous messaging to continue.
     * An error will be thrown if this function is
     * called while the mutex is already released.
     */
    async function _releaseMsgMutex() {
        if (_mutexRelease == null) {
            console.warn('Messaging mutex already released');

            return;
        }

        _mutexRelease();

        _mutexRelease = undefined;
    }

    /**
     * Sends a message synchronously by acquiring the messaging mutex
     * @param msg The message to send
     */
    async function _sendMessage(msg: PopupMsg): Promise<void> {
        await _acquireMsgMutex();

        _connection?.postMessage(msg);
    }

    /**
     * Releases the messaging mutex, allowing synchronous messaging to continue
     * @param msg The ACK message
     */
    function _messageReceived(msg: ReceivedMsg): void {
        if (msg.type === 'received') {
            _releaseMsgMutex();
        } else {
            console.error('Unknown message received:', msg);
        }
    }

    /**
     * Return's the given node's unique id, creating one if none given.
     * Doesn't have anomaly protection.
     * @param node The node
     * @returns The node's unique id
     */
    function _getId(node: Node): string {
        // Handling runtime bugs
        if (node == null) {
            throw new Error('Node anomaly: node is nullish');
        }

        // Getting id
        if (_elementMap.has(node)) {
            return _elementMap.get(node)!;
        } else {
            let id = uuid();

            _elementMap.set(node, id);

            return id;
        }
    }

    function _characterDataHandler(
        mutation: PartialCharacterDataMutationRecord
    ) {
        let id = _getId(mutation.target);

        // TODO TESTING
        console.error(`Character data mutation on node ${id}:`, mutation);
    }

    function _attributesHandler(mutation: PartialAttributeMutationRecord) {
        let id = _getId(mutation.target);

        // TODO TESTING
        console.error(`Attribute mutation on node ${id}:`, mutation);
    }

    function _removedNodesHandler(mutation: PartialNodeMutationRecord) {
        for (let node of mutation.removedNodes) {
            if (_elementMap.has(node)) {
                let id = _elementMap.get(node) as string;
                let msg: RemoveMsg = {
                    type: 'remove',
                    id
                };

                _sendMessage(msg);
            } else {
                console.info('Ignoring anomalous node removal:', node);

                _elementMap.delete(node);
            }
        }
    }

    function _addedNodesHandler(mutation: PartialNodeMutationRecord) {
        for (let node of mutation.addedNodes) {
            let id = _getId(node);

            switch (node.nodeType) {
                case Node.ELEMENT_NODE: {
                    let parentId = _getId(mutation.target!);
                    let prevSiblingId =
                        node.previousSibling == null
                            ? undefined
                            : _getId(node.previousSibling);
                    let msg: UpdateElementMsg = {
                        type: 'update',
                        id,
                        parentId,
                        nodeType: node.nodeType,
                        nodeName: node.nodeName,
                        nodeValue: null,
                        prevSiblingId
                    };

                    _sendMessage(msg);
                    break;
                }
                case Node.COMMENT_NODE: {
                    let parentId = _getId(mutation.target!);
                    let prevSiblingId =
                        node.previousSibling == null
                            ? undefined
                            : _getId(node.previousSibling);
                    let msg: UpdateCommentMsg = {
                        type: 'update',
                        id,
                        parentId,
                        nodeType: node.nodeType,
                        nodeName: node.nodeName,
                        nodeValue: node.nodeValue!,
                        prevSiblingId
                    };

                    _sendMessage(msg);
                    break;
                }
                case Node.DOCUMENT_NODE: {
                    let parentId =
                        mutation.target == null
                            ? undefined
                            : _getId(mutation.target);
                    let doc = node as Document;
                    let msg: UpdateDocumentMsg = {
                        type: 'update',
                        id,
                        nodeType: node.nodeType,
                        nodeName: '#document',
                        nodeValue: null,
                        attributes: {},
                        documentURI: doc.documentURI,
                        parentId // TODO Test document parentId
                    };

                    _sendMessage(msg);
                    break;
                }
                case Node.DOCUMENT_TYPE_NODE: {
                    let doctype = node as DocumentType;
                    let parentId = _getId(mutation.target!);
                    let prevSiblingId =
                        node.previousSibling == null
                            ? undefined
                            : _getId(node.previousSibling);
                    let msg: UpdateDoctypeMsg = {
                        type: 'update',
                        id,
                        nodeType: node.nodeType,
                        nodeName: doctype.nodeName,
                        nodeValue: null,
                        attributes: {},
                        publicId: doctype.publicId,
                        systemId: doctype.systemId,
                        parentId,
                        prevSiblingId
                    };

                    _sendMessage(msg);
                    break;
                }
                case Node.ATTRIBUTE_NODE:
                case Node.TEXT_NODE:
                case Node.CDATA_SECTION_NODE:
                case Node.ENTITY_REFERENCE_NODE:
                case Node.ENTITY_NODE:
                case Node.PROCESSING_INSTRUCTION_NODE:
                case Node.DOCUMENT_FRAGMENT_NODE:
                case Node.NOTATION_NODE:
                default: {
                    console.error(
                        `Unimplemented node type ${node.nodeType} added:`,
                        node
                    );
                    break;
                }
            }
        }
    }

    function _tryFlushingCache() {
        if (_initialDomConstructed) {
            for (let mutation of _mutationCache) {
                switch (mutation.type) {
                    case 'childList': {
                        _addedNodesHandler(mutation);
                        _removedNodesHandler(mutation);
                        break;
                    }
                    case 'attributes': {
                        _attributesHandler(mutation);
                        break;
                    }
                    case 'characterData': {
                        _characterDataHandler(mutation);
                        break;
                    }
                }
            }
        }
    }

    function _mutationsHandler(mutations: PartialMutationRecord[]) {
        for (let mutation of mutations) {
            _mutationCache.push(mutation);
        }

        _tryFlushingCache();
    }

    function _pushInitialDom() {
        let iter = document.createNodeIterator(document);
        let node: Node | null;

        while ((node = iter.nextNode()) != null) {
            _addedNodesHandler({
                type: 'childList',
                target: node.parentNode,
                addedNodes: [node],
                removedNodes: [],
                previousSibling: null
            });

            _attributesHandler({
                type: 'attributes',
                target: node
            });
        }

        _initialDomConstructed = true;
    }

    /**
     * Disconnects the DOM observer
     */
    function _disconnectObserver() {
        _observer?.disconnect();

        _observer = undefined;
    }

    /**
     * Disconnects the popup connection
     */
    function _disconnectConnection() {
        _connection?.onDisconnect.removeListener(_disconnect);
        _connection?.onMessage.removeListener(_messageReceived);
        _connection?.disconnect();

        _connection = undefined;
    }

    /**
     * Pushes all unparsed document changes if possible
     * and immediately terminates the inspector
     */
    function _disconnect(): void {
        window.removeEventListener('beforeunload', _disconnect);

        _disconnectObserver();
        _disconnectConnection();

        console.log('Disconnected from popup!');
    }

    /**
     * Disconnects from the background worker,
     * preventing new connections from being established
     */
    function _disconnectBackground() {
        chrome.runtime.onConnect.removeListener(_onConnect);
    }

    /**
     * The connection handler. Posts document updates to the popup.
     * @param connection
     */
    function _onConnect(connection: chrome.runtime.Port): void {
        console.log(`Successfully connected to popup!`);

        // Completing connection initialization
        _connection = connection;

        _disconnectBackground();
        window.addEventListener('beforeunload', _disconnect);
        _connection.onDisconnect.addListener(_disconnect);
        _connection.onMessage.addListener(_messageReceived);

        // Observing DOM for changes
        _observer = new MutationObserver(_mutationsHandler);

        // TODO Revisit if these attributes are still needed after completion
        _observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true,
            characterDataOldValue: true
        });

        // Pushing initial DOM and blocking mutations, then pushing any mutations
        _pushInitialDom();
        _tryFlushingCache();
    }

    /**
     * Starts the document source inspector,
     * notifying the background worker of our readiness
     * and waiting for the rendering popup to connect with us
     */
    function _connect(): void {
        // Notifying background we're ready to connect
        chrome.runtime.onConnect.addListener(_onConnect);
        chrome.runtime.sendMessage({});
        console.log('Tab ready to connect!');

        // Removing listener after fixed timeout
        // NOTE: Equivalent to background timeout (5s)
        const TIMEOUT_MS = 5_000;

        setTimeout(_disconnectBackground, TIMEOUT_MS);
    }

    _connect();
})();
