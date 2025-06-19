import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';
import { VirtualInlineText } from './text';

interface SharedValues {
    parentId: string;
    nodeType: Node['CDATA_SECTION_NODE'];
    nodeName: '#cdata-section';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateCdataSectionMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualCdataSectionProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualCdataSectionProps =
    NonStoredProps<StoredVirtualCdataSectionProps>;

export function VirtualCdataSection(
    props: Readonly<VirtualCdataSectionProps>
): ReactNode {
    return (
        <div className='node'>
            <VirtualInlineText nodeValue={`<![CDATA[${props.nodeValue}]]>`} />
        </div>
    );
}
