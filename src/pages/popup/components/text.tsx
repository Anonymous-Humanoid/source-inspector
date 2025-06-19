import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateTextMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualTextProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualTextProps = NonStoredProps<StoredVirtualTextProps>;

/**
 * The document source block virtual text node component
 */
export function VirtualText(props: Readonly<VirtualTextProps>): ReactNode {
    const hidden = props.nodeValue === '';

    return (
        <div className={hidden ? undefined : 'node'} hidden={hidden}>
            <VirtualInlineText nodeValue={props.nodeValue} />
        </div>
    );
}

// Key is handled by parent, so no parent ID is necessary
// Node is never persisted, so no ID is necessary
export interface VirtualInlineTextProps {
    nodeValue: string;
}

/**
 * The document source virtual inline text node component
 */
export function VirtualInlineText(
    props: Readonly<VirtualInlineTextProps>
): ReactNode {
    return <pre className='text'>{props.nodeValue}</pre>;
}
