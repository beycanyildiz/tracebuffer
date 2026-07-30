let nodeIdCounter = 1;
const nodeMap = new WeakMap();
export function getOrCreateNodeId(node) {
    if (nodeMap.has(node)) {
        return nodeMap.get(node);
    }
    const id = nodeIdCounter++;
    nodeMap.set(node, id);
    if (node instanceof HTMLElement) {
        node.setAttribute('data-sr-id', String(id));
    }
    return id;
}
export function getNodeById(id) {
    return document.querySelector(`[data-sr-id="${id}"]`);
}
export function serializeDOM(node = document.documentElement) {
    const id = getOrCreateNodeId(node);
    if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || '';
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return textContent;
        }
        // Mask if parent element is masked or password
        if (parent && isMaskedElement(parent)) {
            return '***';
        }
        return textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }
    const element = node;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'script') {
        return { id, tagName: 'script', attributes: {}, children: [] };
    }
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name === 'value' && isMaskedElement(element)) {
            attributes[attr.name] = '***';
        }
        else {
            attributes[attr.name] = attr.value;
        }
    }
    const children = [];
    element.childNodes.forEach((child) => {
        const serializedChild = serializeDOM(child);
        if (serializedChild !== '') {
            children.push(serializedChild);
        }
    });
    return {
        id,
        tagName,
        attributes,
        children,
    };
}
export function isMaskedElement(element) {
    if (element.hasAttribute('data-mask'))
        return true;
    if (element.tagName === 'INPUT') {
        const type = element.type.toLowerCase();
        return type === 'password';
    }
    return false;
}
//# sourceMappingURL=dom-serializer.js.map