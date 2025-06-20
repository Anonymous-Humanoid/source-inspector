import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { StoredVirtualNodeProps } from './base';
import { ChildManager } from './childManager';
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

export type NodeState = { [id: string]: StoredVirtualNodeProps };

export const NodeContext = createContext<NodeState>({});

function binarySearch<T>(
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

function insertMsg(
    queue: Readonly<PopupMsg[]>,
    msg: Readonly<PopupMsg>
): PopupMsg[] {
    return queue.toSpliced(
        binarySearch(queue, msg, (a, b) => b.msgIndex - a.msgIndex),
        0,
        msg
    );
}

function insertAfterSibling(
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

    return [...prevSiblingIds, id, ...nextSiblingIds];
}

/**
 * The main document source inspection UI component.
 * Will do nothing if the connected document can't
 * establish or severs the connection. Due to the
 * connection effect, this component is not expected
 * to work properly in development with React's strict
 * mode enabled.
 *
 * @returns The document source inspection UI component
 */
export default function StateManager(): ReactNode {
    const [firstRun, setFirstRun] = useState<boolean>(true);
    const [tabId, setTabId] = useState<number | undefined>();
    const [root, setRoot] = useState<string | undefined>();
    const [nodes, setNodes] = useState<NodeState>({});
    const [queue, setQueue] = useState<PopupMsg[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(0);

    if (firstRun) {
        // Notifying background page we're ready to connect
        setFirstRun(false);
        chrome.runtime.onMessage.addListener(generateDocument);
        chrome.runtime.sendMessage({} as any);
        console.log('Popup ready to connect!');
    } else if (queue[0]?.msgIndex === queueIndex) {
        // Sending queued messages
        // Relies on state 'nodes', so only one message is processed per render
        const msg = queue[0];

        processMessage(msg);
        setQueue((queue) => queue.slice(1));
        setQueueIndex((i) => i + 1);
    }

    // Configuring connection effect
    // NOTE: Due to the cleanup function, this effect shouldn't
    // work correctly in development with React strict mode enabled.
    // See: https://react.dev/reference/react/useEffect#usage
    useEffect(() => {
        let newConnection: chrome.runtime.Port | undefined;

        if (tabId != null) {
            newConnection = chrome.tabs.connect(tabId);

            newConnection.onDisconnect.addListener(onDisconnect);
            newConnection.onMessage.addListener(queueMessage);

            console.log(`Successfully connected to tab ${tabId}!`);
        }

        return () => {
            newConnection?.disconnect();
        };
    }, [tabId]);

    /**
     * Sets the given virtual node in the virtual DOM tree.
     * @param state The virtual node to set
     * @param id The virtual node id
     * @param parentId The parent virtual node id
     * @param prevSiblingId The previous sibling virtual node id
     */
    function updateNode(
        state: Readonly<StoredVirtualNodeProps>,
        id: Readonly<string>,
        parentId: Readonly<string | null> = null,
        prevSiblingId: Readonly<string | undefined> = undefined
    ): void {
        // Handling root node
        if (parentId == null) {
            if (root != null) {
                const rootMsg = [`Anomalous root node update on id:`, id];
                const siblingMsg =
                    prevSiblingId == null
                        ? []
                        : ['\nUnexpected prevSiblingId:', prevSiblingId];

                console.error(...rootMsg, ...siblingMsg);
                return;
            }

            setRoot(id);
            setNodes((prevNodes) => {
                const nextNodes: NodeState = {
                    ...prevNodes,
                    [id]: state
                };

                return nextNodes;
            });
            return;
        }

        // Handling child node, possibly with siblings
        // If the node already exists, it's updated accordingly
        setNodes((prevNodes) => {
            const nextNodes = {
                ...prevNodes,
                [parentId]: {
                    ...prevNodes[parentId],
                    childNodeIds: insertAfterSibling(
                        prevNodes[parentId].childNodeIds.filter(
                            (childId) => childId != id
                        ),
                        prevSiblingId,
                        id
                    )
                },
                [id]: state
            };

            return nextNodes;
        });
    }

    /**
     * Sets the given virtual attribute in the virtual DOM tree.
     * @param state The virtual attribute to set
     * @param id The virtual attribute id
     * @param parentId The parent virtual node id
     */
    function updateAttribute(
        state: Readonly<StoredVirtualAttributeProps>,
        id: Readonly<string>,
        parentId: Readonly<string>
    ): void {
        setNodes((prevNodes) => {
            const prevParentState = prevNodes[
                parentId
            ] as StoredVirtualElementProps;
            const parentState: StoredVirtualElementProps = {
                ...prevParentState,
                attributeIds: new Set<string>([
                    ...prevParentState.attributeIds,
                    id
                ])
            };
            const nextNodes: NodeState = {
                ...prevNodes,
                [parentId]: parentState,
                [id]: state
            };

            return nextNodes;
        });
    }

    /**
     * Removes the given virtual node and all
     * of its children from the virtual DOM tree
     * @param id The virtual node id to remove
     */
    function removeNode(id: Readonly<string>): void {
        if (id == null || !(id in nodes)) {
            console.error(`Anomalous node removal:`, id);
            return;
        }

        setNodes((prevNodes) => {
            const nextNodes = { ...prevNodes };
            const node = nextNodes[id];
            const parentId = node.parentId;

            // Handling attributes
            if (node.nodeType === Node.ATTRIBUTE_NODE) {
                // Attribute should always have a parent, but just in case
                if (parentId != null) {
                    const parent = nextNodes[
                        parentId
                    ] as StoredVirtualElementProps;

                    parent.attributeIds.delete(id);
                } else {
                    console.warn(
                        `Removing attribute of id ${id} with no parent`
                    );
                }

                delete nextNodes[id];

                return nextNodes;
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

            return nextNodes;
        });
    }

    function updateNodeHandler(msg: Readonly<UpdateMsg>): void {
        switch (msg.nodeType) {
            case Node.ELEMENT_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state: StoredVirtualElementProps = {
                    ...msg,
                    attributeIds: new Set<string>(),
                    childNodeIds: []
                };

                updateNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.ATTRIBUTE_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                if (msg.nodeValue == null) {
                    removeNode(msg.id);
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

                updateAttribute(state, msg.id, parentId);
                break;
            }
            case Node.TEXT_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state: StoredVirtualTextProps = {
                    ...msg,
                    childNodeIds: []
                };

                updateNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.DOCUMENT_NODE: {
                const state: StoredVirtualDocumentProps = {
                    ...msg,
                    childNodeIds: []
                };

                updateNode(state, msg.id, msg.parentId, msg.prevSiblingId);
                break;
            }
            case Node.CDATA_SECTION_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
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

                updateNode(state, msg.id, parentId, msg.prevSiblingId);
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
     * Places the given message into a queue for processing
     * @param msg
     */
    function queueMessage(msg: Readonly<PopupMsg>): void {
        setQueue((q) => insertMsg(q, msg));
    }

    /**
     * Processes the given message, resulting in a
     * virtual DOM tree modification if successful
     * @param msg
     */
    function processMessage(msg: Readonly<PopupMsg>): void {
        switch (msg?.type) {
            case 'update': {
                updateNodeHandler(msg);
                break;
            }
            case 'remove': {
                removeNode(msg.id);
                break;
            }
            default: {
                console.error('Invalid message received:', msg);
            }
        }
    }

    /**
     * If the message is valid, initializes a connection
     * between this popup and the inspected tab
     * @param msg The connection message
     * @param sender The message sender
     */
    function generateDocument(
        msg: Readonly<ConnectMsg>,
        sender: Readonly<chrome.runtime.MessageSender>
    ): void {
        if (
            sender.id === chrome.runtime.id &&
            msg.type === 'connection' &&
            msg.tabId != null
        ) {
            chrome.runtime.onMessage.removeListener(generateDocument);

            setTabId(msg.tabId);
        }
    }

    /**
     * Callback function for when we lose connection with the inspected tab
     */
    function onDisconnect(): void {
        console.log('Disconnected from tab!');
    }

    // Rendering popup
    const childNodes = root == null ? undefined : <ChildManager id={root} />;

    return (
        <main id='app'>
            <NodeContext value={nodes}>{childNodes}</NodeContext>
        </main>
    );
}
