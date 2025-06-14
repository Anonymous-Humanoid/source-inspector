import React, { ReactElement, ReactNode } from 'react';
import { StoredVirtualNodeProps } from './base';
import {
    StoredVirtualCdataSectionProps,
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps,
    StoredVirtualTextProps,
    VirtualCdataSection,
    VirtualDoctype,
    VirtualDocument,
    VirtualElement,
    VirtualText
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

function renderDebug(id: Readonly<string>): ReactNode {
    return (
        process.env.NODE_ENV !== 'production' && (
            <p className='debug node'>{id}</p>
        )
    );
}

function renderChildren(
    node: Readonly<StoredVirtualNodeProps>,
    nodes: Readonly<NodeState>
): ReactElement[] {
    return node.childNodeIds.map((id) => (
        <ChildManager id={id} key={id} nodes={nodes} />
    ));
}

function renderElement(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualElementProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
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

function renderText(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualTextProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualText
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={node.attributes}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderCdataSection(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualCdataSectionProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualCdataSection
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

function renderComment(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualCommentProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualComment
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                attributes={node.attributes}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderDocument(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualDocumentProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
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
    node: Readonly<StoredVirtualDoctypeProps>
): ReactElement {
    return (
        <>
            {renderDebug(props.id)}
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

export function ChildManager(props: Readonly<ChildManagerProps>) {
    let node = props.nodes[props.id];

    switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
            return renderElement(props, node as StoredVirtualElementProps);
        }
        case Node.TEXT_NODE: {
            return renderText(props, node as StoredVirtualTextProps);
        }
        case Node.CDATA_SECTION_NODE: {
            return renderCdataSection(
                props,
                node as StoredVirtualCdataSectionProps
            );
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
        case Node.ENTITY_REFERENCE_NODE:
        case Node.ENTITY_NODE:
        case Node.PROCESSING_INSTRUCTION_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
        case Node.NOTATION_NODE:
        default: {
            return (
                <>
                    {renderDebug(props.id)}
                    <pre key={props.id}>
                        {`Unsupported node type: ${node.nodeType}`}
                    </pre>
                </>
            );
        }
    }
}
