import { v4 as uuid } from 'uuid';
import { TIMEOUT_MS } from './background';
import {
    ConnectMsg,
    PopupMsg,
    RemoveMsg,
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateMsg,
    UpdateTextMsg
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

type KnownNode =
    | Element
    | Attr
    | Text
    | CDATASection
    | EntityReference
    | Entity
    | ProcessingInstruction
    | Comment
    | Document
    | DocumentType
    | DocumentFragment
    | NotationNode;

/**
 * The document source inspector. Communicates document
 * updates to a popup without invoking DevTools, thereby
 * circumventing debugger detection.
 */
(async () => {
    const ADD_NODE_IMPLS = new Set<number>([
        Node['ELEMENT_NODE'],
        // Node['ATTRIBUTE_NODE'],
        Node['TEXT_NODE'],
        Node['CDATA_SECTION_NODE'],

        // See: NodeFilter and https://stackoverflow.com/a/36379751
        // Node['ENTITY_REFERENCE_NODE'],
        // Node['ENTITY_NODE'],
        // Node['NOTATION_NODE'],

        // Node['PROCESSING_INSTRUCTION_NODE'],
        Node['COMMENT_NODE'],
        Node['DOCUMENT_NODE'],
        Node['DOCUMENT_TYPE_NODE']

        // Should never encounter
        // Node['DOCUMENT_FRAGMENT_NODE'],
    ]);
    let _connection: chrome.runtime.Port | undefined;
    let _observer: MutationObserver | undefined;
    let _elementMap = new WeakMap<Node, string>();
    let _initialDomConstructed = false;
    let _mutationCache = new Array<PartialMutationRecord>();
    let _asyncIndex = 0;

    /**
     * Passes a message to the popup without waiting for a response.
     * @param msg The message to send
     */
    function _sendMessage(msg: ConnectMsg | PopupMsg): void {
        _connection?.postMessage(msg);
    }

    /**
     * Return's the given node's unique id, creating one if none given.
     * Doesn't have anomaly protection.
     * @param node The node
     * @returns The node's unique id
     */
    function _getId(node?: null): never;
    function _getId(node: Node): string;
    function _getId(node?: Node | null): string;
    function _getId(node?: Node | null): string {
        // Handling runtime bugs
        if (node == null) {
            throw new Error('Node anomaly: node is nullish');
        }

        // Getting id
        if (_elementMap.has(node)) {
            return _elementMap.get(node)!;
        } else {
            const id = uuid();

            _elementMap.set(node, id);

            return id;
        }
    }

    function _characterDataHandler(
        mutation: PartialCharacterDataMutationRecord
    ): void {
        const id = _getId(mutation.target);

        console.error(`Character data mutation on node ${id}:`, mutation);
    }

    function _attributesHandler(
        mutation: PartialAttributeMutationRecord
    ): void {
        const id = _getId(mutation.target);

        console.error(`Attribute mutation on node ${id}:`, mutation);
    }

    function _removedNodesHandler(mutation: PartialNodeMutationRecord): void {
        for (const node of mutation.removedNodes) {
            if (_elementMap.has(node)) {
                const id = _elementMap.get(node) as string;
                const msg: RemoveMsg = {
                    type: 'remove',
                    id,
                    asyncIndex: _asyncIndex++
                };

                _sendMessage(msg);
            } else {
                console.info('Ignoring anomalous node removal:', node);
            }

            _elementMap.delete(node);
        }
    }

    function _addNode(node: Node, parentNode?: Node | null): void {
        const id = _getId(node);

        if (!ADD_NODE_IMPLS.has(node.nodeType)) {
            console.error(
                `Unimplemented node type ${node.nodeType} not added; ` +
                    `any anomalous parent updates associated with id ` +
                    `${id} are a result of this.`,
                node
            );
            return;
        }

        const cNode = node as KnownNode;
        const prevSiblingId =
            cNode.previousSibling == null
                ? undefined
                : _getId(cNode.previousSibling);

        switch (cNode.nodeType) {
            case Node.ELEMENT_NODE: {
                const parentId = _getId(parentNode);
                const msg: UpdateElementMsg | UpdateTextMsg = {
                    type: 'update',
                    asyncIndex: _asyncIndex++,
                    id,
                    parentId,
                    prevSiblingId,
                    attributes: {},
                    nodeType: cNode.nodeType,
                    nodeName: cNode.nodeName,
                    nodeValue: cNode.nodeValue
                };

                _sendMessage(msg);
                break;
            }
            case Node.DOCUMENT_NODE: {
                const parentId =
                    parentNode == null ? undefined : _getId(parentNode);
                const msg: UpdateDocumentMsg = {
                    type: 'update',
                    asyncIndex: _asyncIndex++,
                    id,
                    parentId,
                    attributes: {},
                    nodeType: cNode.nodeType,
                    nodeName: cNode.nodeName,
                    nodeValue: cNode.nodeValue,
                    documentURI: cNode.documentURI
                };

                _sendMessage(msg);
                return;
            }
            case Node.DOCUMENT_TYPE_NODE: {
                const parentId = _getId(parentNode);
                const msg: UpdateDoctypeMsg = {
                    type: 'update',
                    asyncIndex: _asyncIndex++,
                    id,
                    parentId,
                    prevSiblingId,
                    attributes: {},
                    nodeType: cNode.nodeType,
                    nodeName: cNode.nodeName,
                    nodeValue: cNode.nodeValue,
                    publicId: cNode.publicId,
                    systemId: cNode.systemId
                };

                _sendMessage(msg);
                break;
            }
            case Node.TEXT_NODE:
            case Node.CDATA_SECTION_NODE:
            case Node.COMMENT_NODE: {
                // Setting nodeValue to null actually sets it to an empty string
                const nodeValue = cNode.nodeValue ?? '';
                const parentId = _getId(parentNode);
                const msg = {
                    type: 'update',
                    asyncIndex: _asyncIndex++,
                    id,
                    parentId,
                    prevSiblingId,
                    attributes: {},
                    nodeType: cNode.nodeType,
                    nodeName: cNode.nodeName,
                    nodeValue
                } as UpdateMsg;

                _sendMessage(msg);
                break;
            }
        }
    }

    function _addedNodesHandler(mutation: PartialNodeMutationRecord): void {
        for (let node of mutation.addedNodes) {
            _addNode(node, mutation.target);
        }
    }

    function _tryFlushingCache(): void {
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

    function _mutationsHandler(mutations: PartialMutationRecord[]): void {
        for (let mutation of mutations) {
            _mutationCache.push(mutation);
        }

        _tryFlushingCache();
    }

    function _pushInitialDom(): void {
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
    function _disconnectObserver(): void {
        _observer?.disconnect();

        _observer = undefined;
    }

    /**
     * Disconnects the popup connection
     */
    function _disconnectConnection(): void {
        _connection?.onDisconnect.removeListener(_disconnect);
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
    function _disconnectBackground(): void {
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

        // Observing DOM for changes
        _observer = new MutationObserver(_mutationsHandler);

        _observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
            // attributeOldValue: true,
            // characterDataOldValue: true
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
        chrome.runtime.sendMessage({} as any);
        console.log('Tab ready to connect!');

        // Removing listener after fixed timeout
        setTimeout(_disconnectBackground, TIMEOUT_MS);
    }

    _connect();
})();
