import { ReactNode } from 'react';

export interface StoredVirtualNodeProps {
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    childNodeIds: string[];
    parentId?: string;
}

export interface NoChildren {
    childNodeIds: never[];
}

export type NonStoredProps<P> = Omit<
    StoredVirtualNodeProps & P,
    'childNodeIds' | 'attributeIds'
> & {
    id: string;
    children?: P extends NoChildren ? never[] : ReactNode[];
};
