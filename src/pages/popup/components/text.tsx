import React, { ReactElement } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string;
    prevSiblingId?: string;
    children?: never[];
}

export type UpdateTextMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualTextProps = StoredVirtualNodeProps &
    SharedValues & { childNodeIds: never[] };

export type VirtualTextProps = NonStoredProps<StoredVirtualTextProps>;

/**
 * The document source block virtual text node component
 */
export function VirtualText(props: Readonly<VirtualTextProps>): ReactElement {
    const hidden = props.nodeValue === '';

    return (
        <div className={hidden ? undefined : 'node'} hidden={hidden}>
            <VirtualInlineText
                parentId={props.id}
                nodeValue={props.nodeValue}
            />
        </div>
    );
}

// Never persisted, so no ID is necessary
export interface VirtualInlineTextProps {
    parentId: string;
    nodeValue: string;
}

/**
 * The document source virtual inline text node component
 */
export function VirtualInlineText(
    props: Readonly<VirtualInlineTextProps>
): ReactElement {
    return <div className='text'>{props.nodeValue}</div>;
}
