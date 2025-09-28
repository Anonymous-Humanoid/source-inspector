import React, { createContext, ReactNode } from 'react';
import { StoredVirtualNodeProps } from './base';
import {
    StoredVirtualAttributeProps,
    StoredVirtualCdataSectionProps,
    StoredVirtualCommentProps,
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps,
    StoredVirtualProcessingInstructionProps,
    StoredVirtualTextProps
} from './components';
import { ConnectMsg, PopupMsg, UpdateMsg } from './msgs';
import NodeTree from './popup';

export type NodeState = { [id: string]: StoredVirtualNodeProps };

export const NodeContext = createContext<NodeState>({});

export interface PopupProps {
    rootId: string | undefined;
    nodes: NodeState;
}

/**
 * Maintains the state for the popup without using React,
 * allowing for asynchronous message processing and decoupled
 * popup rendering
 */
export class PopupManager {
    private readonly connectTab;
    private readonly generateDocument;
    private readonly queueMessage;
    private readonly onDisconnect;
    private newConnection: chrome.runtime.Port | null;
    private queue: PopupMsg[];
    private queueIndex: number;

    /**
     * @implNote To prevent unsynchronized state access,
     * state should be treated as if it were immutable,
     * like React states. In simpler terms, set the state
     * all at once, don't modify it piece-by-piece.
     * This way, unsynchronized access will only return
     * a previous state, rather than a potentially malformed
     * state. Obviously, this means that state setting should
     * be handled by only one thread, as opposed to retrieving.
     */
    private rootId: string | undefined;
    /**
     * @implNote To prevent unsynchronized state access,
     * state should be treated as if it were immutable,
     * like React states. In simpler terms, set the state
     * all at once, don't modify it piece-by-piece.
     * This way, unsynchronized access will only return
     * a previous state, rather than a potentially malformed
     * state. Obviously, this means that state setting should
     * be handled by only one thread, as opposed to retrieving.
     */
    private nodes: NodeState;

    constructor() {
        this.connectTab = this._connectTab.bind(this);
        this.generateDocument = this._generateDocument.bind(this);
        this.queueMessage = this._queueMessage.bind(this);
        this.onDisconnect = this._onDisconnect.bind(this);
        this.newConnection = null;
        this.queue = [];
        this.queueIndex = 0;
        this.rootId = undefined;
        this.nodes = {};
    }

    /**
     * Notifies the background page that the popup is ready to connect
     */
    public connect(): Promise<void> {
        chrome.runtime.onMessage.addListener(this.generateDocument);
        console.log('Popup ready to connect!');
        return chrome.runtime.sendMessage({} as any);
    }

    private _connectTab(tabId: number): void {
        this.newConnection = chrome.tabs.connect(tabId);

        this.newConnection.onDisconnect.addListener(this.onDisconnect);
        this.newConnection.onMessage.addListener(this.queueMessage);

        console.log(`Successfully connected to tab ${tabId}!`);
    }

    /**
     * If the message is valid, initializes a connection
     * between this popup and the inspected tab
     * @param msg The connection message
     * @param sender The message sender
     */
    private _generateDocument(
        msg: Readonly<ConnectMsg>,
        sender: Readonly<chrome.runtime.MessageSender>
    ): void {
        if (
            sender.id === chrome.runtime.id &&
            msg.type === 'connection' &&
            msg.tabId != null
        ) {
            chrome.runtime.onMessage.removeListener(this.generateDocument);
            this.connectTab(msg.tabId);
        }
    }

    private binarySearch<T>(
        arr: Readonly<T[]>,
        e: Readonly<T>,
        comparator: (eArr: T, e: T) => number
    ): number {
        // https://stackoverflow.com/a/29018745
        let m = 0;
        let n = arr.length - 1;

        while (m <= n) {
            const k = (n + m) >> 1;
            const cmp = comparator(arr[k], e);

            if (cmp > 0) {
                m = k + 1;
            } else if (cmp < 0) {
                n = k - 1;
            } else {
                return k;
            }
        }

        return m;
    }

    private insertMsg(
        queue: Readonly<PopupMsg[]>,
        msg: Readonly<PopupMsg>
    ): PopupMsg[] {
        return queue.toSpliced(
            this.binarySearch(queue, msg, (a, b) => b.msgIndex - a.msgIndex),
            0,
            msg
        );
    }

    private insertAfterSibling(
        childNodeIds: Readonly<string[]>,
        prevSiblingId: Readonly<string | undefined>,
        id: Readonly<string>
    ): string[] {
        if (prevSiblingId == null) {
            return [id, ...childNodeIds];
        }

        const prevSiblingIds = [];
        const nextSiblingIds = [];
        let prevSiblingFound = false;

        for (const siblingId of childNodeIds) {
            if (prevSiblingFound) {
                nextSiblingIds.push(siblingId);
            } else {
                prevSiblingIds.push(siblingId);

                if (siblingId === prevSiblingId) {
                    prevSiblingFound = true;
                }
            }
        }

        if (!prevSiblingFound) {
            console.warn(
                `Anomalous update: sibling ID ${prevSiblingId} not found`
            );
        }

        return [...prevSiblingIds, id, ...nextSiblingIds];
    }

    /**
     * Places the given message into a queue for processing
     * @param msg
     */
    private _queueMessage(msg: Readonly<PopupMsg>): void {
        this.queue = this.insertMsg(this.queue, msg);

        if (this.queue[0]?.msgIndex === this.queueIndex) {
            // Sending queued messages
            // Relies on state 'nodes', so only one message is processed per render
            const msg = this.queue[0];

            this.processMessage(msg);
            this.queue = this.queue.slice(1);
            this.queueIndex++;
        }
    }

    /**
     * Processes the given message, resulting in a
     * virtual DOM tree modification if successful
     * @param msg
     */
    private processMessage(msg: Readonly<PopupMsg>): void {
        switch (msg?.type) {
            case 'update': {
                this.updateNodeHandler(msg);
                break;
            }
            case 'remove': {
                this.removeNode(msg.id);
                break;
            }
            default: {
                console.error('Invalid message received:', msg);
            }
        }
    }

    /**
     * Sets the given virtual node in the virtual DOM tree.
     * @param state The virtual node to set
     * @param id The virtual node id
     * @param parentId The parent virtual node id
     * @param prevSiblingId The previous sibling virtual node id
     */
    private updateNode(
        state: Readonly<StoredVirtualNodeProps>,
        id: Readonly<string>,
        parentId: Readonly<string | null> = null,
        prevSiblingId: Readonly<string | undefined> = undefined
    ): void {
        // Handling root node
        if (parentId == null) {
            if (this.rootId != null) {
                const rootMsg = [`Anomalous root node update on id:`, id];
                const siblingMsg =
                    prevSiblingId == null
                        ? []
                        : ['\nUnexpected prevSiblingId:', prevSiblingId];

                console.error(...rootMsg, ...siblingMsg);
                return;
            }

            this.rootId = id;
            this.nodes = {
                ...this.nodes,
                [id]: state
            };
            return;
        }

        // Handling child node, possibly with siblings
        // If the node already exists, it's updated accordingly
        this.nodes = {
            ...this.nodes,
            [parentId]: {
                ...this.nodes[parentId],
                childNodeIds: this.insertAfterSibling(
                    this.nodes[parentId].childNodeIds.filter(
                        (childId) => childId != id
                    ),
                    prevSiblingId,
                    id
                )
            },
            [id]: state
        };
    }

    /**
     * Sets the given virtual attribute in the virtual DOM tree.
     * @param state The virtual attribute to set
     * @param id The virtual attribute id
     * @param parentId The parent virtual node id
     */
    private updateAttribute(
        state: Readonly<StoredVirtualAttributeProps>,
        id: Readonly<string>,
        parentId: Readonly<string>
    ): void {
        const prevParentState = this.nodes[
            parentId
        ] as StoredVirtualElementProps;
        const parentState: StoredVirtualElementProps = {
            ...prevParentState,
            attributeIds: new Set<string>([...prevParentState.attributeIds, id])
        };
        const nextNodes: NodeState = {
            ...this.nodes,
            [parentId]: parentState,
            [id]: state
        };

        this.nodes = nextNodes;
    }

    /**
     * Removes the given virtual node and all
     * of its children from the virtual DOM tree
     * @param id The virtual node id to remove
     */
    private removeNode(id: Readonly<string>): void {
        if (id == null || !(id in this.nodes)) {
            console.error(`Anomalous node removal:`, id);
            return;
        }

        const nextNodes = { ...this.nodes };
        const node = nextNodes[id];
        const parentId = node.parentId;

        // Handling attributes
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            // Attribute should always have a parent, but just in case
            if (parentId != null) {
                const parent = nextNodes[parentId] as StoredVirtualElementProps;

                parent.attributeIds.delete(id);
            } else {
                console.warn(`Removing attribute of id ${id} with no parent`);
            }

            delete nextNodes[id];

            this.nodes = nextNodes;
            return;
        }

        const childNodeIds = [...node.childNodeIds];
        let currentId: string | undefined;

        // Removing references to node
        if (parentId != null) {
            nextNodes[parentId].childNodeIds = nextNodes[
                parentId
            ].childNodeIds.filter((childId) => childId != id);
        }

        // Removing children in node subtree breadth-first
        while ((currentId = childNodeIds.pop()) != null) {
            const currentNode = nextNodes[currentId];

            childNodeIds.push(...currentNode.childNodeIds);

            // Removing element attributes
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                const element = currentNode as StoredVirtualElementProps;

                for (const attrId of element.attributeIds) {
                    delete nextNodes[attrId];
                }
            }

            delete nextNodes[currentId];
        }

        this.nodes = nextNodes;
    }

    private updateNodeHandler(msg: Readonly<UpdateMsg>): void {
        switch (msg.nodeType) {
            case Node.ELEMENT_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in this.nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state: StoredVirtualElementProps = {
                    ...msg,
                    attributeIds: new Set<string>(),
                    childNodeIds: []
                };

                this.updateNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.ATTRIBUTE_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in this.nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                if (msg.nodeValue == null) {
                    this.removeNode(msg.id);
                    return;
                }

                const state: StoredVirtualAttributeProps = {
                    id: msg.id,
                    parentId: msg.parentId,
                    nodeType: msg.nodeType,
                    nodeName: msg.nodeName,
                    nodeValue: msg.nodeValue,
                    childNodeIds: []
                };

                this.updateAttribute(state, msg.id, parentId);
                break;
            }
            case Node.TEXT_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in this.nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state: StoredVirtualTextProps = {
                    ...msg,
                    childNodeIds: []
                };

                this.updateNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.DOCUMENT_NODE: {
                const state: StoredVirtualDocumentProps = {
                    ...msg,
                    childNodeIds: []
                };

                this.updateNode(state, msg.id, msg.parentId, msg.prevSiblingId);
                break;
            }
            case Node.CDATA_SECTION_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in this.nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state:
                    | StoredVirtualCdataSectionProps
                    | StoredVirtualProcessingInstructionProps
                    | StoredVirtualCommentProps
                    | StoredVirtualDoctypeProps = {
                    ...msg,
                    childNodeIds: []
                };

                this.updateNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.ENTITY_REFERENCE_NODE:
            case Node.ENTITY_NODE:
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.NOTATION_NODE:
            default: {
                console.error(
                    `Unsupported node type ${msg.nodeType} updated:`,
                    msg
                );
                break;
            }
        }
    }

    /**
     * Severs the connection with the tab, if any
     */
    public disconnect(): void {
        this.newConnection?.disconnect();
    }

    /**
     * Callback function for when we lose connection with the inspected tab
     */
    private _onDisconnect(): void {
        console.log('Disconnected from tab!');
    }

    /**
     * Returns shallow copies of the current states
     * @returns The current states
     */
    public getCurrentStates(): PopupProps {
        return {
            rootId: this.rootId,
            nodes: { ...this.nodes }
        };
    }

    /**
     * Returns a popup component, templated for its props
     * @returns The popup component
     */
    public static Popup(props: Readonly<PopupProps>): ReactNode {
        return (
            <main id='app'>
                <NodeContext value={props.nodes}>
                    <NodeTree rootId={props.rootId} />
                </NodeContext>
            </main>
        );
    }
}
