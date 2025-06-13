import React, { ReactNode } from 'react';
import { VirtualInlineText, VirtualAttribute } from './components';

export interface StoredVirtualNodeProps {
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    attributes: Record<string, string>;
    childNodeIds: string[];
    parentId?: string;
}

export type NonStoredProps<P> = VirtualNodeProps & Omit<P, 'childNodeIds'>;

export interface VirtualNodeProps
    extends Omit<StoredVirtualNodeProps, 'childNodeIds'> {
    id: string;
    children?: ReactNode[];
}

export function VirtualNode(props: Readonly<VirtualNodeProps>) {
    let attrs =
        props.attributes == null
            ? ''
            : Object.entries(props.attributes).map(([name, value]) => {
                  let id = `${props.id}-attr-${name}`;

                  return (
                      <VirtualAttribute
                          id={id}
                          key={id}
                          nodeValue={value}
                          nodeName={name}
                          nodeType={Node['ATTRIBUTE_NODE']}
                          attributes={{}}
                      />
                  );
              });

    return (
        <pre className='node' key={props.id}>
            {`<${props.nodeName}`}
            {attrs}&gt;
            <VirtualInlineText
                parentId={props.id}
                nodeValue={props.nodeValue ?? ''}
            />
            {props.children}
            {`</${props.nodeName}>`}
        </pre>
    );
}
