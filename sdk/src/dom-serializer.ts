import { VNode } from './types';

let nodeIdCounter = 1;
const nodeMap = new WeakMap<Node, number>();

export function getOrCreateNodeId(node: Node | null): number | null {
  if (!node) return null;
  if (nodeMap.has(node)) {
    return nodeMap.get(node)!;
  }
  const id = nodeIdCounter++;
  nodeMap.set(node, id);
  if (node instanceof HTMLElement) {
    node.setAttribute('data-sr-id', String(id));
  }
  return id;
}

export function getNodeById(id: number): Node | null {
  return document.querySelector(`[data-sr-id="${id}"]`);
}

export function serializeDOM(node: Node = document.documentElement): VNode | string {
  if (!node) return '';
  const id = getOrCreateNodeId(node)!;

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

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'script') {
    return { id, tagName: 'script', attributes: {}, children: [] };
  }

  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name === 'value' && isMaskedElement(element)) {
      attributes[attr.name] = '***';
    } else {
      attributes[attr.name] = attr.value;
    }
  }

  // Ensure dynamic input values are captured in snapshot
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    const val = (element as HTMLInputElement).value;
    attributes['value'] = isMaskedElement(element) ? '***' : val;
  }

  const children: (VNode | string)[] = [];
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

export function isMaskedElement(element: HTMLElement | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  if (element.hasAttribute('data-mask')) return true;
  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type.toLowerCase();
    return type === 'password';
  }
  return false;
}
