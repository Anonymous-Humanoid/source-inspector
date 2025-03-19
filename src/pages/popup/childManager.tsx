import React, { ReactElement, ReactNode } from 'react';
import { StoredVirtualNodeProps } from './base';
import {
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps,
    VirtualDoctype,
    VirtualDocument,
    VirtualElement
} from './components';
import {
    StoredVirtualCommentProps,
    VirtualComment
} from './components/comment';

export type NodeState = { [id: string]: StoredVirtualNodeProps };

interface ChildManagerProps {
    id: string;
    nodes: NodeState;
}

function renderDebug(props: Readonly<ChildManagerProps>): ReactNode {
    return (
        process.env.NODE_ENV !== 'production' && (
            <p className='node debug'>{props.id}</p>
        )
    );
}

function renderChildren(
    node: StoredVirtualNodeProps,
    nodes: NodeState
): ReactElement[] {
    return node.childNodeIds.map((id) => (
        <ChildManager id={id} key={id} nodes={nodes} />
    ));
}

function renderDocument(
    props: Readonly<ChildManagerProps>,
    node: StoredVirtualDocumentProps
): ReactElement {
    return (
        <>
            {renderDebug(props)}
            <VirtualDocument
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={node.attributes}
                documentURI={node.documentURI}
            >
                {renderChildren(node, props.nodes)}
            </VirtualDocument>
        </>
    );
}

function renderDoctype(
    props: Readonly<ChildManagerProps>,
    node: StoredVirtualDoctypeProps
): ReactElement {
    return (
        <>
            {renderDebug(props)}
            <VirtualDoctype
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={node.attributes}
                publicId={node.publicId}
                systemId={node.systemId}
                parentId={node.parentId}
            />
        </>
    );
}

function renderComment(
    props: Readonly<ChildManagerProps>,
    node: StoredVirtualCommentProps
): ReactElement {
    return (
        <>
            {renderDebug(props)}
            <VirtualComment
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={{}}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderElement(
    props: Readonly<ChildManagerProps>,
    node: StoredVirtualElementProps
): ReactElement {
    return (
        <>
            {renderDebug(props)}
            <VirtualElement
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={node.attributes}
            >
                {renderChildren(node, props.nodes)}
            </VirtualElement>
        </>
    );
}

export function ChildManager(props: Readonly<ChildManagerProps>) {
    let node = props.nodes[props.id];

    switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
            return renderElement(props, node as StoredVirtualElementProps);
        }
        case Node.COMMENT_NODE: {
            return renderComment(props, node as StoredVirtualCommentProps);
        }
        case Node.DOCUMENT_NODE: {
            return renderDocument(props, node as StoredVirtualDocumentProps);
        }
        case Node.DOCUMENT_TYPE_NODE: {
            return renderDoctype(props, node as StoredVirtualDoctypeProps);
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
            return (
                <>
                    {renderDebug(props)}
                    <pre key={props.id}>
                        {`Unsupported node type: ${node.nodeType}`}
                    </pre>
                </>
            );
        }
    }
}
