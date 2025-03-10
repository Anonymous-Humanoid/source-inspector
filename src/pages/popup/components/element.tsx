import { NonStoredProps, StoredVirtualNodeProps, VirtualNode } from '../base';
import { BaseUpdateMsg } from '../msgs';

interface SharedValues {
    nodeType: Node['ELEMENT_NODE'];
}

export type UpdateElementMsg = BaseUpdateMsg & SharedValues;

export type StoredVirtualElementProps = StoredVirtualNodeProps & SharedValues;

export type VirtualElementProps = NonStoredProps<StoredVirtualElementProps>;

export { VirtualNode as VirtualElement };
