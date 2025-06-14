import React, { ReactElement } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string;
    attributes: Record<string, never>;
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
