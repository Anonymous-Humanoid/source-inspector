import React, { ReactNode } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

type SharedValues = {
    id: string;
    parentId: string;
    nodeType: Node['ATTRIBUTE_NODE'];
    nodeName: string;
    nodeValue: string | null;
    childNodeIds: never[];
    prevSiblingId?: undefined;
};

export type UpdateAttributeMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualAttributeProps = StoredVirtualNodeProps & SharedValues;

export type VirtualAttributeProps = NonStoredProps<StoredVirtualAttributeProps>;

/**
 * The document source virtual element attribute component
 */
export function VirtualAttribute(
    props: Readonly<VirtualAttributeProps>
): ReactNode {
    return (
        <>
            <div className='attr'>{' ' + props.nodeName}</div>
            {props.nodeValue == null ? undefined : (
                <>
                    ="
                    <div className='string'>{props.nodeValue}</div>"
                </>
            )}
        </>
    );
}
