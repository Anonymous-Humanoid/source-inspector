import React from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['COMMENT_NODE'];
    nodeName: '#comment';
    nodeValue: string;
    attributes: {};
    prevSiblingId?: string;
    children?: never[];
}

export type UpdateCommentMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualCommentProps = StoredVirtualNodeProps & SharedValues;

export type VirtualCommentProps = NonStoredProps<StoredVirtualCommentProps>;

export function VirtualComment(props: Readonly<VirtualCommentProps>) {
    return (
        <pre className='comment node' key={props.id}>
            {`<!--${props.nodeValue}-->`}
        </pre>
    );
}
