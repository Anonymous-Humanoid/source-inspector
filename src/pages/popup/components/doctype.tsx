import React from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['DOCUMENT_TYPE_NODE'];
    nodeName: string;
    nodeValue: null;
    attributes: Record<string, never>;
    publicId: string;
    systemId: string;
    children?: never[];
}

export type UpdateDoctypeMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualDoctypeProps = StoredVirtualNodeProps &
    SharedValues & { childNodeIds: never[] };

export type VirtualDoctypeProps = NonStoredProps<StoredVirtualDoctypeProps>;

export function VirtualDoctype(props: Readonly<VirtualDoctypeProps>) {
    let xmlId = '';

    if (props.publicId !== '') {
        xmlId += ` PUBLIC "${props.publicId}"`;

        if (props.systemId !== '') {
            xmlId += ` "${props.systemId}"`;
        }
    } else if (props.systemId !== '') {
        xmlId += ` SYSTEM "${props.systemId}"`;
    }

    return (
        <pre className='doctype node' key={props.id}>
            {`<!DOCTYPE ${props.nodeName}${xmlId}>`}
        </pre>
    );
}
