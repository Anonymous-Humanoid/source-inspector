import React, { ReactNode } from 'react';
import { BaseUpdateMsg } from '../msgs';
import { VirtualInlineText } from './text';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';

export interface SharedValues {
    parentId: string;
    nodeType: Node['PROCESSING_INSTRUCTION_NODE'];
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateProcessingInstructionMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualProcessingInstructionProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualProcessingInstructionProps =
    NonStoredProps<StoredVirtualProcessingInstructionProps>;

export function VirtualProcessingInstruction(
    props: VirtualProcessingInstructionProps
): ReactNode {
    const data = props.nodeValue === '' ? '' : ' ' + props.nodeValue;

    return (
        <div className='node'>
            <VirtualInlineText nodeValue={`<?${props.nodeName}${data}?>`} />
        </div>
    );
}
