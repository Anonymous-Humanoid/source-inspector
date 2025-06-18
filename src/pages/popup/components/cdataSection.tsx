import React, { ReactNode } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';
import { VirtualInlineText } from './text';

interface SharedValues {
    parentId: string;
    nodeType: Node['CDATA_SECTION_NODE'];
    nodeName: '#cdata-section';
    nodeValue: string;
    prevSiblingId?: string;
    children?: never[];
}

export type UpdateCdataSectionMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualCdataSectionProps = StoredVirtualNodeProps &
    SharedValues;

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
