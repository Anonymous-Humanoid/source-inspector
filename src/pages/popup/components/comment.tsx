import React, { ReactNode } from 'react';
import { NoChildren, NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    parentId: string;
    nodeType: Node['COMMENT_NODE'];
    nodeName: '#comment';
    nodeValue: string;
    prevSiblingId?: string;
}

export type UpdateCommentMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualCommentProps = StoredVirtualNodeProps &
    SharedValues &
    NoChildren;

export type VirtualCommentProps = NonStoredProps<StoredVirtualCommentProps>;

export function VirtualComment(
    props: Readonly<VirtualCommentProps>
): ReactNode {
    return <pre className='comment node'>{`<!--${props.nodeValue}-->`}</pre>;
}
