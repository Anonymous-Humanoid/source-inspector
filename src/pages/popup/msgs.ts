import {
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg
} from './components';

export {
    UpdateCdataSectionMsg,
    UpdateCommentMsg,
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg
};

export type AnyMsg = PopupMsg | ReceivedMsg;

export type PopupMsg = ConnectMsg | RemoveMsg | UpdateMsg;

interface Msg {
    type: string;
}

export interface ConnectMsg extends Msg {
    type: 'connection';
    tabId: number;
}

export interface ReceivedMsg extends Msg {
    type: 'received';
}

export interface RemoveMsg extends Msg {
    type: 'remove';
    id: string;
}

export type UpdateMsg =
    | UpdateElementMsg
    | UpdateAttributeNodeMsg
    | UpdateTextNodeMsg
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

export interface UpdateTextNodeMsg extends BaseUpdateMsg {
    nodeType: Node['TEXT_NODE'];
    nodeValue: string;
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
