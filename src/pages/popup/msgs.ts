import {
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateTextMsg
} from './components';

export {
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateTextMsg
};

export type PopupMsg = RemoveMsg | UpdateMsg;

interface Msg {
    type: string;
    asyncIndex: number;
}

export interface ConnectMsg extends Omit<Msg, 'asyncIndex'> {
    type: 'connection';
    tabId: number;
}

export interface RemoveMsg extends Msg {
    type: 'remove';
    id: string;
}

export type UpdateMsg =
    | UpdateElementMsg
    | UpdateAttributeNodeMsg
    | UpdateTextMsg
    | UpdateCdataSectionMsg
    | UpdateEntityRefMsg
    | UpdateEntityMsg
    | UpdateInstructionMsg
    | UpdateCommentMsg
    | UpdateDocumentMsg
    | UpdateDoctypeMsg
    | UpdateDocFragmentMsg
    | UpdateNotationMsg;

export interface BaseUpdateMsg extends Msg {
    type: 'update';
    id: string;
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    parentId?: string | undefined;
    prevSiblingId?: string;
}

export interface UpdateAttributeNodeMsg extends BaseUpdateMsg {
    nodeType: Node['ATTRIBUTE_NODE'];
}

export interface UpdateEntityRefMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_REFERENCE_NODE'];
}

export interface UpdateEntityMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_NODE'];
}

export interface UpdateInstructionMsg extends BaseUpdateMsg {
    nodeType: Node['PROCESSING_INSTRUCTION_NODE'];
}

export interface UpdateDocFragmentMsg extends BaseUpdateMsg {
    nodeType: Node['DOCUMENT_FRAGMENT_NODE'];
}

export interface UpdateNotationMsg extends BaseUpdateMsg {
    nodeType: Node['NOTATION_NODE'];
}
