import React, { useEffect, useState } from 'react';
import { ChildManager, NodeState } from './childManager';
import {
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps
} from './components';
import {
    ConnectMsg,
    PopupMsg,
    ReceivedMsg,
    RemoveMsg,
    UpdateMsg
} from './msgs';
import { StoredVirtualCommentProps } from './components/comment';
import { sleep } from '../shared';
import { StoredVirtualNodeProps, VirtualNodeProps } from './base';

// TODO Add showChildren method and dropdowns to VirtualElementType
// TODO VirtualNodeType UI indentation
// TODO Documentation

function insertAfterSibling(
    childNodeIds: string[],
    prevSiblingId: string | undefined,
    id: string
): string[] {
    if (prevSiblingId == null) {
        return [id, ...childNodeIds];
    }

    let prevSiblingIds = [];
    let nextSiblingIds = [];
    let prevSiblingFound = false;

    for (let siblingId of childNodeIds) {
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
 * to work properly in development with strict mode
 * enabled.
 *
 * @returns The document source inspection UI component
 */
export default function StateManager() {
    const [firstRun, setFirstRun] = useState<boolean>(true);
    const [tabId, setTabId] = useState<number | undefined>();
    const [root, setRoot] = useState<string | undefined>();
    const [nodes, setNodes] = useState<NodeState>({});
    const [queue, setQueue] = useState<PopupMsg[]>([]);
    let [connection, setConnection] = useState<
        chrome.runtime.Port | undefined
    >();

    if (firstRun && root == null) {
        // Notifying background page we're ready to connect
        setFirstRun(false);
        chrome.runtime.onMessage.addListener(generateDocument);
        chrome.runtime.sendMessage({});
        console.log('Popup ready to connect!');
    } else if (queue.length > 0) {
        // Sending queued messages
        // Relies on state 'nodes', so only one message is processed per render
        const msg = queue.shift()!;

        handleMessage(msg);
        setQueue((queue) => queue.slice(1));
    }

    // Configuring connection effect
    // NOTE: Due to the cleanup function, this effect shouldn't
    // work correctly in development with React strict mode enabled.
    // See: https://react.dev/reference/react/useEffect#usage
    useEffect(() => {
        let newConnection: chrome.runtime.Port | undefined;

        if (tabId != null) {
            newConnection = chrome.tabs.connect(tabId);

            setConnection(newConnection);

            newConnection.onDisconnect.addListener(onDisconnect);
            newConnection.onMessage.addListener(queueMessage);

            connection = newConnection;

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
        state: StoredVirtualNodeProps,
        id: string,
        parentId: string | null = null,
        prevSiblingId: string | undefined = undefined
    ): void {
        // Handling root node
        if (parentId == null) {
            if (root != null) {
                let rootMsg = [`Anomalous root node update on id:`, id];
                let siblingMsg =
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
    function removeNode(id: string): void {
        if (id == null || !(id in nodes)) {
            console.error(`Anomalous node removal:`, id);
            return;
        }

        setNodes((prevNodes) => {
            let nextNodes = { ...prevNodes };
            let node = nextNodes[id];
            let parentId = node.parentId;
            let childNodeIds = [...node.childNodeIds];
            let currentId: string | undefined;

            // Removing references to node
            if (parentId != null) {
                nextNodes[parentId].childNodeIds = nextNodes[
                    parentId
                ].childNodeIds.filter((childId) => childId != id);
            }

            // Iteratively removing references to node children
            while ((currentId = childNodeIds.pop()) != null) {
                let currentNode = nextNodes[currentId];

                childNodeIds.push(...currentNode.childNodeIds);

                delete nextNodes[currentId];
            }

            return nextNodes;
        });
    }

    function updateNodeHandler(msg: UpdateMsg): void {
        switch (msg.nodeType) {
            case Node.ELEMENT_NODE: {
                let parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                let state: StoredVirtualElementProps = {
                    nodeType: msg.nodeType,
                    nodeName: msg.nodeName,
                    nodeValue: msg.nodeValue,
                    attributes: {},
                    childNodeIds: [],
                    parentId
                };

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.COMMENT_NODE: {
                let parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                let state: StoredVirtualCommentProps = {
                    nodeType: msg.nodeType,
                    nodeName: '#comment',
                    nodeValue: msg.nodeValue,
                    attributes: {},
                    childNodeIds: [],
                    parentId
                };

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.DOCUMENT_NODE: {
                let parentId = msg.parentId;
                let state: StoredVirtualDocumentProps = {
                    nodeType: msg.nodeType,
                    nodeName: msg.nodeName,
                    nodeValue: msg.nodeValue,
                    attributes: {},
                    childNodeIds: [],
                    parentId,
                    documentURI: msg.documentURI
                };

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.DOCUMENT_TYPE_NODE: {
                let parentId = msg.parentId;

                if (parentId == null || !(parentId in nodes)) {
                    console.error(`Anomalous node parent update:`, msg);
                    return;
                }

                let state: StoredVirtualDoctypeProps = {
                    nodeType: msg.nodeType,
                    nodeName: msg.nodeName,
                    nodeValue: msg.nodeValue,
                    publicId: msg.publicId,
                    systemId: msg.systemId,
                    attributes: {},
                    childNodeIds: [],
                    parentId
                };

                insertNode(state, msg.id, parentId, msg.prevSiblingId);
                break;
            }
            case Node.TEXT_NODE:
            case Node.ATTRIBUTE_NODE:
            case Node.CDATA_SECTION_NODE:
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
    function queueMessage(msg: PopupMsg): void {
        setQueue((queue) => [...queue, msg]);

        // Notifying content script we've received the last message
        let ack: ReceivedMsg = { type: 'received' };

        connection?.postMessage(ack);
    }

    /**
     * Processes the given message, resulting in a
     * virtual DOM tree modification if successful
     * @param msg
     */
    function handleMessage(msg: PopupMsg): void {
        switch (msg.type) {
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
        msg: ConnectMsg,
        sender: chrome.runtime.MessageSender
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
        setConnection(undefined);

        console.log('Disconnected from tab!');
    }

    // Rendering popup
    let childNodes =
        root == null ? undefined : <ChildManager id={root} nodes={nodes} />;

    return <main id='app'>{childNodes}</main>;
}
