import React, { ReactNode, useContext } from 'react';
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
import { NodeContext, NodeState } from './stateManager';

function renderDebug(id: Readonly<string>): ReactNode {
    return (
        process.env.NODE_ENV !== 'production' && (
            <p className='debug node'>{id}</p>
        )
    );
}

function renderChildren(node: Readonly<StoredVirtualNodeProps>): ReactNode[] {
    return node.childNodeIds.map((id) => <ChildManager id={id} key={id} />);
}

function renderElement(
    id: Readonly<string>,
    node: Readonly<StoredVirtualElementProps>,
    nodes: Readonly<NodeState>
): ReactNode {
    const attrs = node.attributeIds.keys().map((attrId) => {
        const attrNode = nodes[attrId] as StoredVirtualAttributeProps;

        return (
            <VirtualAttribute
                id={attrId}
                key={attrId}
                parentId={id}
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
                key={`${id}-inline`}
                nodeValue={node.nodeValue ?? ''}
            />,
            ...renderChildren(node),
            `</${node.nodeName}>`
        ];
    }

    return (
        <>
            {renderDebug(id)}
            <VirtualElement
                id={id}
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
    id: Readonly<string>,
    node: Readonly<StoredVirtualAttributeProps>
): ReactNode {
    return (
        <VirtualAttribute
            id={id}
            parentId={node.parentId}
            nodeType={node.nodeType}
            nodeName={node.nodeName}
            nodeValue={node.nodeValue}
        />
    );
}

function renderText(
    id: Readonly<string>,
    node: Readonly<StoredVirtualTextProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualText
                id={id}
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
    id: Readonly<string>,
    node: Readonly<StoredVirtualCdataSectionProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualCdataSection
                id={id}
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
    id: Readonly<string>,
    node: Readonly<StoredVirtualProcessingInstructionProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualProcessingInstruction
                id={id}
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
    id: Readonly<string>,
    node: Readonly<StoredVirtualCommentProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualComment
                id={id}
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
    id: Readonly<string>,
    node: Readonly<StoredVirtualDocumentProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualDocument
                id={id}
                nodeType={node.nodeType}
                nodeName={node.nodeName}
                nodeValue={node.nodeValue}
                documentURI={node.documentURI}
            >
                {renderChildren(node)}
            </VirtualDocument>
        </>
    );
}

function renderDoctype(
    id: Readonly<string>,
    node: Readonly<StoredVirtualDoctypeProps>
): ReactNode {
    return (
        <>
            {renderDebug(id)}
            <VirtualDoctype
                id={id}
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

export function ChildManager({ id }: { readonly id: string }): ReactNode {
    const nodes = useContext<NodeState>(NodeContext);
    const node = nodes[id];

    switch (node.nodeType) {
        case Node.ELEMENT_NODE: {
            return renderElement(id, node as StoredVirtualElementProps, nodes);
        }
        case Node.ATTRIBUTE_NODE: {
            return renderAttribute(id, node as StoredVirtualAttributeProps);
        }
        case Node.TEXT_NODE: {
            return renderText(id, node as StoredVirtualTextProps);
        }
        case Node.CDATA_SECTION_NODE: {
            return renderCdataSection(
                id,
                node as StoredVirtualCdataSectionProps
            );
        }
        case Node.PROCESSING_INSTRUCTION_NODE: {
            return renderProcessingInstruction(
                id,
                node as StoredVirtualProcessingInstructionProps
            );
        }
        case Node.COMMENT_NODE: {
            return renderComment(id, node as StoredVirtualCommentProps);
        }
        case Node.DOCUMENT_NODE: {
            return renderDocument(id, node as StoredVirtualDocumentProps);
        }
        case Node.DOCUMENT_TYPE_NODE: {
            return renderDoctype(id, node as StoredVirtualDoctypeProps);
        }
        case Node.ENTITY_REFERENCE_NODE:
        case Node.ENTITY_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
        case Node.NOTATION_NODE:
        default: {
            return (
                <>
                    {renderDebug(id)}
                    <div className='node'>
                        {`Unsupported node type: ${node.nodeType}`}
                    </div>
                </>
            );
        }
    }
}
