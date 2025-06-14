import React, { useEffect, useState } from 'react';
import { StoredVirtualNodeProps } from './base';
import { ChildManager, NodeState } from './childManager';
import {
    StoredVirtualCdataSectionProps,
    StoredVirtualCommentProps,
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps,
    StoredVirtualTextProps
} from './components';
import { ConnectMsg, PopupMsg, UpdateMsg } from './msgs';

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
        binarySearch(queue, msg, (a, b) => b.asyncIndex - a.asyncIndex),
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
export default function StateManager() {
    const [firstRun, setFirstRun] = useState<boolean>(true);
    const [tabId, setTabId] = useState<number | undefined>();
    const [root, setRoot] = useState<string | undefined>();
    const [nodes, setNodes] = useState<NodeState>({});
    const [queue, setQueue] = useState<PopupMsg[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(0);

    if (firstRun && root == null) {
        // Notifying background page we're ready to connect
        setFirstRun(false);
        chrome.runtime.onMessage.addListener(generateDocument);
        chrome.runtime.sendMessage({} as any);
        console.log('Popup ready to connect!');
    } else if (queue[0]?.asyncIndex === queueIndex) {
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
     * Inserts the given virtual node into the virtual DOM tree.
     * @param state The virtual node to insert
     * @param id The virtual node id
     * @param parentId The parent virtual node id
     * @param prevSiblingId The previous sibling virtual node id
     */
    function insertNode(
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
                return {
                    ...prevNodes,
                    [id]: state
                };
            });
            return;
        }

        // Handling child node, possibly with siblings
        // If the node already exists, it's moved to its new location
        setNodes((prevNodes) => {
            return {
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
            const childNodeIds = [...node.childNodeIds];
            let currentId: string | undefined;

            // Removing references to node
            if (parentId != null) {
                nextNodes[parentId].childNodeIds = nextNodes[
                    parentId
                ].childNodeIds.filter((childId) => childId != id);
            }

            // Iteratively removing references to node children
            while ((currentId = childNodeIds.pop()) != null) {
                const currentNode = nextNodes[currentId];

                childNodeIds.push(...currentNode.childNodeIds);

                delete nextNodes[currentId];
            }

            return nextNodes;
        });
    }

    function updateNodeHandler(msg: Readonly<UpdateMsg>): void {
        switch (msg.nodeType) {
            case Node.DOCUMENT_NODE: {
                const state: StoredVirtualDocumentProps = {
                    ...msg,
                    childNodeIds: []
                };

                insertNode(state, msg.id, msg.parentId, msg.prevSiblingId);
                break;
            }
            case Node.ELEMENT_NODE:
            case Node.CDATA_SECTION_NODE:
            case Node.COMMENT_NODE:
            case Node.DOCUMENT_TYPE_NODE: {
                const parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                const state:
                    | StoredVirtualElementProps
                    | StoredVirtualCdataSectionProps
                    | StoredVirtualCommentProps
                    | StoredVirtualDoctypeProps = {
                    ...msg,
                    childNodeIds: []
                };

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
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

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.ATTRIBUTE_NODE:
            case Node.ENTITY_REFERENCE_NODE:
            case Node.ENTITY_NODE:
            case Node.PROCESSING_INSTRUCTION_NODE:
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
        setQueue((queue) => insertMsg(queue, msg));
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
     * If valid, initializes a connection between
     * this popup and the inspected tab
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

    function onDisconnect(): void {
        console.log('Disconnected from tab!');
    }

    // Rendering popup
    const childNodes =
        root == null ? undefined : <ChildManager id={root} nodes={nodes} />;

    return <main id='app'>{childNodes}</main>;
}
