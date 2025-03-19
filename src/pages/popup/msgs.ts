import {
    UpdateDoctypeMsg,
    UpdateDocumentMsg,
    UpdateElementMsg
} from './components';

export { UpdateDoctypeMsg, UpdateDocumentMsg, UpdateElementMsg };

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
    | UpdateCdataMsg
    | UpdateEntityRefMsg
    | UpdateEntityMsg
    | UpdateInstructionMsg
    | UpdateCommentMsg
    | UpdateDocumentMsg
    | UpdateDoctypeMsg
    | UpdateDocFragmentMsg
    | UpdateNotationMsg;

// TODO Don't send redundant information?
export interface BaseUpdateMsg extends Msg {
    type: 'update';
    id: string;
    parentId: string | undefined;
    nodeType: number;
    nodeName: string;
    nodeValue: string | null;
    prevSiblingId?: string;
}

export interface UpdateCommentMsg extends BaseUpdateMsg {
    parentId: string;
    nodeType: Node['COMMENT_NODE'];
    nodeValue: string;
}

// TODO UpdateAttributeNodeMsg
export interface UpdateAttributeNodeMsg extends BaseUpdateMsg {
    nodeType: Node['ATTRIBUTE_NODE'];
}

// TODO UpdateTextNodeMsg
export interface UpdateTextNodeMsg extends BaseUpdateMsg {
    nodeType: Node['TEXT_NODE'];
    nodeValue: string;
}

// TODO UpdateCdataMsg
export interface UpdateCdataMsg extends BaseUpdateMsg {
    nodeType: Node['CDATA_SECTION_NODE'];
}

// TODO UpdateEntityRefMsg
export interface UpdateEntityRefMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_REFERENCE_NODE'];
}

// TODO UpdateEntityMsg
export interface UpdateEntityMsg extends BaseUpdateMsg {
    nodeType: Node['ENTITY_NODE'];
}

// TODO UpdateInstructionMsg
export interface UpdateInstructionMsg extends BaseUpdateMsg {
    nodeType: Node['PROCESSING_INSTRUCTION_NODE'];
}

// TODO UpdateDocFragmentMsg
export interface UpdateDocFragmentMsg extends BaseUpdateMsg {
    nodeType: Node['DOCUMENT_FRAGMENT_NODE'];
}

// TODO UpdateNotationMsg
export interface UpdateNotationMsg extends BaseUpdateMsg {
    nodeType: Node['NOTATION_NODE'];
}
