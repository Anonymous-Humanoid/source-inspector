import React, { Fragment, ReactElement } from 'react';

export interface VirtualAttributeProps {
    id: string;
    nodeType: Node['ATTRIBUTE_NODE'];
    nodeName: string;
    nodeValue: string | null;
    attributes: Record<string, never>;
    childNodeIds?: never[];
    parentId?: string;
}

/**
 * The document source virtual element attribute component
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
