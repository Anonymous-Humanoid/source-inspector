import {
    UpdateAttributeMsg,
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg,
    UpdateProcessingInstructionMsg,
    UpdateTextMsg
} from './components';

export {
    UpdateAttributeMsg,
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
    msgIndex: number;
}

export interface ConnectMsg extends Omit<Msg, 'msgIndex'> {
    type: 'connection';
    tabId: number;
}

export interface RemoveMsg extends Msg {
    type: 'remove';
    id: string;
}

export type UpdateMsg =
    | UpdateElementMsg
    | UpdateAttributeMsg
    | UpdateTextMsg
    | UpdateCdataSectionMsg
    | UpdateEntityRefMsg
    | UpdateEntityMsg
    | UpdateProcessingInstructionMsg
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

export interface UpdateEntityRefMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_REFERENCE_NODE'];
}

export interface UpdateEntityMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_NODE'];
}

export interface UpdateDocFragmentMsg extends BaseUpdateMsg {
    nodeType: Node['DOCUMENT_FRAGMENT_NODE'];
}

export interface UpdateNotationMsg extends BaseUpdateMsg {
    nodeType: Node['NOTATION_NODE'];
}
