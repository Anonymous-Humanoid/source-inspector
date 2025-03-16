import React, { useEffect, useState } from 'react';
import { ChildManager, NodeState } from './childManager';
import { StoredVirtualDoctypeProps, StoredVirtualDocumentProps, StoredVirtualElementProps } from './components';
import {
    ConnectMsg,
    PopupMsg,
    ReceivedMsg,
    RemoveMsg,
    UpdateMsg
} from './msgs';
import { StoredVirtualCommentProps } from './components/comment';

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
        } 
        else {
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
    let [connection, setConnection] = useState<
        chrome.runtime.Port | undefined
    >();
    
    if (firstRun && root == null) {
        // Notifying background page we're ready to connect
        setFirstRun(false);
        chrome.runtime.onMessage.addListener(generateDocument);
        chrome.runtime.sendMessage({});
        console.log('Popup ready to connect!');
    }
    else if (root != null) {
        // Notifying content script we've received the last message
        let ack: ReceivedMsg = { type: 'received' };
        
        connection?.postMessage(ack);
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
            newConnection.onMessage.addListener(updateDocument);

            connection = newConnection;
            
            console.log(`Successfully connected to tab ${tabId}!`);
        }

        return () => {
            newConnection?.disconnect();
        };
    }, [tabId]);

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

                setNodes((prevNodes) => {
                    return {
                        ...prevNodes,
                        [parentId]: {
                            ...prevNodes[parentId],
                            childNodeIds: insertAfterSibling(
                                prevNodes[parentId].childNodeIds,
                                msg.prevSiblingId,
                                msg.id
                            )
                        },
                        [msg.id]: state
                    };
                });
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

                setNodes((prevNodes) => {
                    return {
                        ...prevNodes,
                        [parentId]: {
                            ...prevNodes[parentId],
                            childNodeIds: insertAfterSibling(
                                prevNodes[parentId].childNodeIds,
                                msg.prevSiblingId,
                                msg.id
                            )
                        },
                        [msg.id]: state
                    };
                });
                break;
            }
            case Node.DOCUMENT_NODE: {
                let state: StoredVirtualDocumentProps = {
                    nodeType: msg.nodeType,
                    nodeName: msg.nodeName,
                    nodeValue: msg.nodeValue,
                    attributes: {},
                    childNodeIds: [],
                    documentURI: msg.documentURI
                };

                if (root == null) {
                    setRoot(msg.id);
                    setNodes((prevNodes) => {
                        return {
                            ...prevNodes,
                            [msg.id]: state
                        };
                    });
                } else {
                    let parentId = msg.parentId!;
                    let state: StoredVirtualDocumentProps = {
                        nodeType: msg.nodeType,
                        nodeName: msg.nodeName,
                        nodeValue: msg.nodeValue,
                        attributes: {},
                        childNodeIds: [],
                        parentId,
                        documentURI: msg.documentURI
                    };

                    setNodes((prevNodes) => {
                        return {
                            ...prevNodes,
                            [parentId]: {
                                ...prevNodes[parentId],
                                childNodeIds: insertAfterSibling(
                                    prevNodes[parentId].childNodeIds,
                                    msg.prevSiblingId,
                                    msg.id
                                )
                            },
                            [msg.id]: state
                        };
                    });
                }

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
                
                setNodes((prevNodes) => {
                    return {
                        ...prevNodes,
                        [parentId]: {
                            ...prevNodes[parentId],
                            childNodeIds: insertAfterSibling(
                                prevNodes[parentId].childNodeIds,
                                msg.prevSiblingId,
                                msg.id
                            )
                        },
                        [msg.id]: state
                    };
                });
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

    function removeNodeHandler(msg: RemoveMsg): void {
        // TODO Remove nodes (Ensure no memory leaks on node removal)
        console.error('Node removal currently unsupported:', msg);
    }

    function updateDocument(msg: PopupMsg): void {
        switch (msg.type) {
            case 'update': {
                updateNodeHandler(msg);
                break;
            }
            case 'remove': {
                removeNodeHandler(msg);
                break;
            }
            default: {
                console.error('Invalid message received:', msg);
                return;
            }
        }

        let ack: ReceivedMsg = { type: 'received' };

        connection?.postMessage(ack);
    }

    /**
     * If valid, initializes a connection between this popup and the inspected tab
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
