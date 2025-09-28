import React, { ReactNode } from 'react';
import { ChildManager } from './childManager';

export interface NodeTreeProps {
    rootId: string | undefined;
}

/**
 * The main document source inspection UI component.
 * Will do nothing if the connected document can't
 * establish or severs the connection. Due to the
 * connection effect, this component is not expected
 * to work properly in development with React's strict
 * mode enabled.
 *
 * @returns The document source inspection UI component
 */
export default function NodeTree(props: NodeTreeProps): ReactNode {
    const childNodes =
        props.rootId == null ? undefined : <ChildManager id={props.rootId} />;

    return childNodes;
}
