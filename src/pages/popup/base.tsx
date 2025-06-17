import { ReactNode } from 'react';

export interface StoredVirtualNodeProps {
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    childNodeIds: string[];
    parentId?: string;
}

export type NonStoredProps<P> = VirtualNodeProps &
    Omit<P, 'childNodeIds' | 'attributeIds'>;

export interface VirtualNodeProps
    extends Omit<StoredVirtualNodeProps, 'childNodeIds'> {
    id: string;
    children?: ReactNode[];
}
