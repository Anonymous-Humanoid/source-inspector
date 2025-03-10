import React, { Fragment, ReactElement, ReactNode } from 'react';

export type AttrDict = { [key: string]: string };

export interface StoredVirtualNodeProps {
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    attributes: AttrDict;
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
                          childNodeIds={[]}
                      />
                  );
              });

    let inlineTextId = `${props.id}-inline`;

    return (
        <pre className='node' key={props.id}>
            {`<${props.nodeName}`}
            {attrs}&gt;
            <VirtualInlineText
                id={inlineTextId}
                nodeValue={props.nodeValue}
                nodeType={Node['TEXT_NODE']}
                nodeName='#text'
                attributes={{}}
                childNodeIds={[]}
            />
            {props.children}
            {`</${props.nodeName}>`}
        </pre>
    );
}

interface VirtualTextProps {
    id: string;
    nodeType: Node['TEXT_NODE'];
    nodeName: '#text';
    nodeValue: string | null;
    attributes: {};
    childNodeIds: never[];
    parentId?: string;
}

/**
 * The document source inline text node virtual component
 */
export function VirtualInlineText(
    props: Readonly<VirtualTextProps>
): ReactElement {
    return (
        <div className='text' key={props.id} id={props.id}>
            {props.nodeValue}
        </div>
    );
}

/**
 * The document source block text node virtual component
 */
export function VirtualTextNode(
    props: Readonly<VirtualTextProps>
): ReactElement {
    return (
        <div className='node'>
            <VirtualInlineText
                id={props.id}
                nodeValue={props.nodeValue}
                nodeType={Node['TEXT_NODE']}
                nodeName='#text'
                attributes={{}}
                childNodeIds={[]}
            />
        </div>
    );
}

interface VirtualAttributeProps {
    id: string;
    nodeType: Node['ATTRIBUTE_NODE'];
    nodeName: string;
    nodeValue: string | null;
    attributes: {};
    childNodeIds: never[];
    parentId?: string;
}

/**
 * The document source element attribute Virtual component
 */
export function VirtualAttribute(
    props: Readonly<VirtualAttributeProps>
): ReactElement {
    return (
        <Fragment key={props.id}>
            <div className='attr'>{' ' + props.nodeName}</div>
            {props.nodeValue == null ? undefined : (
                <>
                    <div>="</div>
                    <div className='string'>{props.nodeValue}</div>
                    <div>"</div>
                </>
            )}
        </Fragment>
    );
}
