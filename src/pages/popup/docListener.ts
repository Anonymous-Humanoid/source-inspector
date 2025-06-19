import { UpdateProcessingInstructionMsg } from './components';
import type {
    ConnectMsg,
    PopupMsg,
    RemoveMsg,
    UpdateAttributeMsg,
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateTextMsg
} from './msgs';

/**
 * The document source inspector. Communicates document
 * updates to a popup without invoking DevTools, thereby
 * circumventing debugger detection.
 */
(async () => {
    const { v4: uuid } = require('uuid');
    const { TIMEOUT_MS } = require('./background');

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
        readonly attributeName: string;
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

    const ADD_NODE_SUPPORTED_TYPES = new Set<Readonly<number>>([
        Node['ELEMENT_NODE'],
        // Node['ATTRIBUTE_NODE'], // Should never encounter
        Node['TEXT_NODE'],
        Node['CDATA_SECTION_NODE'],
        Node['PROCESSING_INSTRUCTION_NODE'],
        Node['COMMENT_NODE'],
        Node['DOCUMENT_NODE'],
        Node['DOCUMENT_TYPE_NODE']
        // ,Node['DOCUMENT_FRAGMENT_NODE'] // Shadow root

        // Should never be used
        // For implementation, see: https://stackoverflow.com/a/36379751
        // ,Node['ENTITY_REFERENCE_NODE']
        // ,Node['ENTITY_NODE']
        // ,Node['NOTATION_NODE']
    ]);
    let _connection: chrome.runtime.Port | undefined;
    let _observer: MutationObserver | undefined;
    const _elementMap = new WeakMap<Node, string>();
    const _attrMap = new WeakMap<
        Element,
        Array<{ id: string; attrName: string }>
    >();
    let _initialDomConstructed = false;
    const _mutationCache = new Array<Readonly<PartialMutationRecord>>();
    let _msgIndex = 0;

    /**
     * Passes a message to the popup without waiting for a response.
     * @param msg The message to send
     */
    function _sendMessage(msg: Readonly<ConnectMsg | PopupMsg>): void {
        _connection?.postMessage(msg);
    }

    /**
     * Return's the given node's unique id, creating one if none given.
     * Doesn't have anomaly protection.
     * @param node The node
     * @returns The node's unique id
     */
    function _getId(node?: Readonly<null | undefined>): never;
    function _getId(node: Readonly<Node>): string;
    function _getId(node?: Readonly<Node | null | undefined>): string;
    function _getId(node?: Readonly<Node | null | undefined>): string {
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

    function _getAttrId(
        ownerElement: Readonly<Element>,
        attribute: Readonly<Attr | null>,
        attributeName: Readonly<string>
    ): string {
        const attrName = attributeName.toLowerCase();

        // Race condition: attribute may have since been modified
        const attr = attribute ?? ownerElement.getAttributeNode(attrName);

        if (!_attrMap.has(ownerElement)) {
            _attrMap.set(ownerElement, []);
        }

        const elementAttrCaches = _attrMap.get(ownerElement)!;
        let attrCache = elementAttrCaches.find(
            (obj) => obj.attrName === attrName
        );

        if (attrCache == null) {
            const id = _getId(attr!);
            attrCache = { id, attrName };

            elementAttrCaches.push(attrCache);

            return id;
        } else if (attr == null) {
            return attrCache.id;
        }

        const id = _getId(attr);

        attrCache = elementAttrCaches.find((obj) => obj.id === id);

        if (attrCache == null) {
            attrCache = { id, attrName };

            elementAttrCaches.push(attrCache);
        } else {
            attrCache.attrName = attrName;
        }

        return attrCache.id;
    }

    function _characterDataHandler(
        mutation: Readonly<PartialCharacterDataMutationRecord>
    ): void {
        const id = _getId(mutation.target);

        console.error(`Character data mutation on node ${id}:`, mutation);
    }

    function _attributesHandler(
        mutation: Readonly<PartialAttributeMutationRecord>
    ): void {
        const ownerNode = mutation.target;
        const attrName = mutation.attributeName;
        const parentId = _getId(ownerNode);

        if (ownerNode.nodeType !== Node.ELEMENT_NODE) {
            console.error(
                `Invalid attribute mutation on node of id ${parentId}:`,
                ownerNode
            );
            return;
        }

        const ownerElement = ownerNode as Element;
        const attr = ownerElement.getAttributeNode(attrName);
        const id = _getAttrId(ownerElement, attr, attrName);
        const msg: UpdateAttributeMsg = {
            type: 'update',
            msgIndex: _msgIndex++,
            id,
            parentId,
            nodeType: Node.ATTRIBUTE_NODE,
            nodeName: attrName.toLowerCase(),
            nodeValue: attr?.nodeValue ?? null
        };

        _sendMessage(msg);
    }

    function _removedNodesHandler(
        mutation: Readonly<PartialNodeMutationRecord>
    ): void {
        for (const node of mutation.removedNodes) {
            if (node.nodeType === Node.ATTRIBUTE_NODE) {
                // Should never happen
                const attr = node as Attr;

                console.warn(
                    'Encountered attribute in node removal method:',
                    attr,
                    'Proceed with caution.'
                );

                if (attr.ownerElement != null) {
                    // Should always happen if we somehow get this far
                    _attributesHandler({
                        type: 'attributes',
                        target: attr.ownerElement,
                        attributeName: attr.nodeName
                    });
                }
            } else if (_elementMap.has(node)) {
                const id = _elementMap.get(node) as string;
                const msg: RemoveMsg = {
                    type: 'remove',
                    id,
                    msgIndex: _msgIndex++
                };

                _sendMessage(msg);
            } else {
                console.info('Ignoring anomalous node removal:', node);
            }
        }
    }

    function _addNode(
        node: Readonly<Node>,
        parentNode?: Readonly<Node | null | undefined>
    ): void {
        const id = _getId(node);

        if (!ADD_NODE_SUPPORTED_TYPES.has(node.nodeType)) {
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
                const msg: UpdateElementMsg = {
                    type: 'update',
                    msgIndex: _msgIndex++,
                    id,
                    parentId,
                    prevSiblingId,
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
                    msgIndex: _msgIndex++,
                    id,
                    parentId,
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
                    msgIndex: _msgIndex++,
                    id,
                    parentId,
                    prevSiblingId,
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
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE: {
                // Setting nodeValue to null actually sets it to an empty string
                const nodeValue = cNode.nodeValue ?? '';
                const parentId = _getId(parentNode);
                const msg = {
                    type: 'update',
                    msgIndex: _msgIndex++,
                    id,
                    parentId,
                    prevSiblingId,
                    nodeType: cNode.nodeType,
                    nodeName: cNode.nodeName,
                    nodeValue
                } as
                    | UpdateTextMsg
                    | UpdateCdataSectionMsg
                    | UpdateCommentMsg
                    | UpdateProcessingInstructionMsg;

                _sendMessage(msg);
                break;
            }
            default: {
                // Should never happen
                console.error(
                    `Skipping addition of unimplemented node ` +
                        `of type ${node.nodeType}; ` +
                        `any anomalous parent updates associated with id ` +
                        `${id} are a result of this.`
                );
            }
        }
    }

    function _addedNodesHandler(
        mutation: Readonly<PartialNodeMutationRecord>
    ): void {
        for (const node of mutation.addedNodes) {
            _addNode(node, mutation.target);
        }
    }

    function _tryFlushingCache(): void {
        if (_initialDomConstructed) {
            for (const mutation of _mutationCache) {
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

    function _mutationsHandler(
        mutations: Readonly<PartialMutationRecord[]>
    ): void {
        for (const mutation of mutations) {
            _mutationCache.push(mutation);
        }

        _tryFlushingCache();
    }

    function _pushInitialDom(): void {
        const iter = document.createNodeIterator(document);
        let node: Node | null;

        while ((node = iter.nextNode()) != null) {
            _addedNodesHandler({
                type: 'childList',
                target: node.parentNode,
                addedNodes: [node],
                removedNodes: [],
                previousSibling: null
            });

            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                for (const attr of element.attributes) {
                    _attributesHandler({
                        type: 'attributes',
                        target: element,
                        attributeName: attr.nodeName
                    });
                }
            }

            // _characterDataHandler({
            //     type: 'characterData',
            //     target: node
            // });
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
        _observer = new MutationObserver(_mutationsHandler as MutationCallback);

        _observer.observe(document, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
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
