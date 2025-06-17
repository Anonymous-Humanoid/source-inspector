import React, { ReactElement } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

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
): ReactElement {
    return (
        <pre className='node'>
            <p className='text'>{`<![CDATA[${props.nodeValue}]]>`}</p>
        </pre>
    );
}
