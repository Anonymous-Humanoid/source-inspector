import React, { ReactNode } from 'react';
import { StoredVirtualNodeProps } from './base';
import {
    StoredVirtualAttributeProps,
    StoredVirtualCdataSectionProps,
    StoredVirtualCommentProps,
    StoredVirtualDoctypeProps,
    StoredVirtualDocumentProps,
    StoredVirtualElementProps,
    StoredVirtualProcessingInstructionProps,
    StoredVirtualTextProps,
    VirtualAttribute,
    VirtualCdataSection,
    VirtualComment,
    VirtualDoctype,
    VirtualDocument,
    VirtualElement,
    VirtualInlineText,
    VirtualProcessingInstruction,
    VirtualText
} from './components';

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
): ReactNode[] {
    return node.childNodeIds.map((id) => (
        <ChildManager id={id} key={id} nodes={nodes} />
    ));
}

function renderElement(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualElementProps>
): ReactNode {
    const attrs = node.attributeIds.keys().map((id) => {
        const attrNode = props.nodes[id] as StoredVirtualAttributeProps;

        return (
            <VirtualAttribute
                id={id}
                key={id}
                parentId={props.id}
                nodeValue={attrNode.nodeValue}
                nodeName={attrNode.nodeName}
                nodeType={attrNode.nodeType}
            />
        );
    });

    let renderingChildren: ReactNode[];

    if (node.childNodeIds.length < 1 && node.nodeValue == null) {
        renderingChildren = [...attrs, ' />'];
    } else {
        renderingChildren = [
            ...attrs,
            '>',
            <VirtualInlineText
                key={`${props.id}-inline`}
                nodeValue={node.nodeValue ?? ''}
            />,
            ...renderChildren(node, props.nodes),
            `</${node.nodeName}>`
        ];
    }

    return (
        <>
            {renderDebug(props.id)}
            <VirtualElement
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
            >
                {renderingChildren}
            </VirtualElement>
        </>
    );
}

function renderAttribute(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualAttributeProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualAttribute
                id={props.id}
                parentId={node.parentId}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
            >
                {renderChildren(node, props.nodes)}
            </VirtualAttribute>
        </>
    );
}

function renderText(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualTextProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualText
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderCdataSection(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualCdataSectionProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualCdataSection
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderProcessingInstruction(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualProcessingInstructionProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualProcessingInstruction
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderComment(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualCommentProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualComment
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                parentId={node.parentId}
                prevSiblingId={node.prevSiblingId}
            />
        </>
    );
}

function renderDocument(
    props: Readonly<ChildManagerProps>,
    node: Readonly<StoredVirtualDocumentProps>
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualDocument
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
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
): ReactNode {
    return (
        <>
            {renderDebug(props.id)}
            <VirtualDoctype
                id={props.id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                publicId={node.publicId}
                systemId={node.systemId}
                parentId={node.parentId}
            />
        </>
    );
}

export function ChildManager(props: Readonly<ChildManagerProps>): ReactNode {
    const node = props.nodes[props.id];

    switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
            return renderElement(props, node as StoredVirtualElementProps);
        }
        case Node.ATTRIBUTE_NODE: {
            return renderAttribute(props, node as StoredVirtualAttributeProps);
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
        case Node.PROCESSING_INSTRUCTION_NODE: {
            return renderProcessingInstruction(
                props,
                node as StoredVirtualProcessingInstructionProps
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
        case Node.ENTITY_REFERENCE_NODE:
        case Node.ENTITY_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
        case Node.NOTATION_NODE:
        default: {
            return (
                <>
                    {renderDebug(props.id)}
                    <div className='node'>
                        {`Unsupported node type: ${node.nodeType}`}
                    </div>
                </>
            );
        }
    }
}
