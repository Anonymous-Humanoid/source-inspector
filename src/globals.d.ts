declare global {
    // Extends existing type
    interface Element {
        nodeType: Node['ELEMENT_NODE'];
        nodeValue: null;
    }

    // Extends existing type
    interface Attr {
        nodeType: Node['ATTRIBUTE_NODE'];
        nodeValue: string;
        previousSibling: null;
    }

    // Extends existing type
    interface Text {
        nodeType: Node['TEXT_NODE'];
        nodeName: '#text';
        nodeValue: string;
    }

    // Extends existing type
    interface CDATASection {
        nodeType: Node['CDATA_SECTION_NODE'];
        nodeName: '#cdata-section';
        nodeValue: string;
    }

    interface EntityReference extends Node {
        nodeType: Node['ENTITY_REFERENCE_NODE'];
    }

    interface Entity extends Node {
        nodeType: Node['ENTITY_NODE'];
    }

    // Extends existing type
    interface ProcessingInstruction {
        // For XML declaration, see:
        // https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-prolog-dtd
        nodeType: Node['PROCESSING_INSTRUCTION_NODE'];
        nodeValue: string;
    }

    // Extends existing type
    interface Comment {
        nodeType: Node['COMMENT_NODE'];
        nodeName: '#comment';
    }

    // Extends existing type
    interface Document {
        nodeType: Node['DOCUMENT_NODE'];
        nodeName: '#document';
        nodeValue: null;
        previousSibling: null;
    }

    // Extends existing type
    interface DocumentType {
        nodeType: Node['DOCUMENT_TYPE_NODE'];
        nodeValue: null;
    }

    // Extends existing type
    interface DocumentFragment {
        nodeType: Node['DOCUMENT_FRAGMENT_NODE'];
        nodeValue: null;
    }

    interface NotationNode extends Node {
        nodeType: Node['NOTATION_NODE'];
    }
}

export {};
