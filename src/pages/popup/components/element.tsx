import React, { ReactElement } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['ELEMENT_NODE'];
}

export type UpdateElementMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualElementProps = StoredVirtualNodeProps &
    SharedValues & { attributeIds: Set<string> };

export type VirtualElementProps = NonStoredProps<StoredVirtualElementProps>;

export function VirtualElement(
    props: Readonly<VirtualElementProps>
): ReactElement {
    // Parts of this component's rendering are handled by the child manager
    return (
        <pre className='node'>
            {`<${props.nodeName}`}
            {props.children}
        </pre>
    );
}
