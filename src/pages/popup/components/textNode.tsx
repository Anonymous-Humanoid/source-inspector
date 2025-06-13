import React, { ReactElement } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string;
    attributes: Record<string, never>;
    parentId?: string;
    prevSiblingId?: string;
    children?: never[];
}

export type UpdateTextNodeMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualTextNodeProps = StoredVirtualNodeProps &
    SharedValues & { childNodeIds: never[] };

export type VirtualTextNodeProps = NonStoredProps<StoredVirtualTextNodeProps>;

/**
 * The document source block virtual text node component
 */
export function VirtualTextNode(
    props: Readonly<VirtualTextNodeProps>
): ReactElement {
    const hidden = props.nodeValue === '';

    return (
        <div
            key={props.id}
            className={hidden ? undefined : 'node'}
            hidden={hidden}
        >
            <VirtualInlineText
                parentId={props.id}
                nodeValue={props.nodeValue}
            />
        </div>
    );
}

export interface VirtualInlineTextNodeProps {
    parentId: string;
    nodeValue: string;
}

/**
 * The document source virtual inline text node component
 */
export function VirtualInlineText(
    props: Readonly<VirtualInlineTextNodeProps>
): ReactElement {
    return (
        <div
            className='text'
            key={props.parentId}
            id={`${props.parentId}-inline`}
        >
            {props.nodeValue}
        </div>
    );
}
