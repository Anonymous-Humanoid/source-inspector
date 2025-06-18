import React, { ReactNode } from 'react';
import { NonStoredProps, StoredVirtualNodeProps } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['DOCUMENT_NODE'];
    nodeName: '#document';
    nodeValue: null;
    prevSiblingId?: undefined;
    documentURI: string;
}

export type UpdateDocumentMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualDocumentProps = StoredVirtualNodeProps & SharedValues;

export type VirtualDocumentProps = NonStoredProps<StoredVirtualDocumentProps>;

export function VirtualDocument(props: VirtualDocumentProps): ReactNode {
    // For security, don't change the rel attribute
    // See: https://stackoverflow.com/a/17711167/8387760
    return (
        <div className='document node'>
            {`${props.nodeName} (`}
            <a
                target='_blank'
                rel='noopener noreferrer'
                href={props.documentURI}
            >
                {props.documentURI}
            </a>
            {`)`}
            <ul>{props.children}</ul>
        </div>
    );
}
