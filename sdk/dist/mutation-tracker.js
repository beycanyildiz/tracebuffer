export class MutationTracker {
    constructor(onMutation) {
        this.observer = null;
        this.onMutation = onMutation;
    }
    start() {
        if (typeof MutationObserver === 'undefined')
            return;
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const targetId = mutation.target.getAttribute?.('data-sr-id') || null;
                if (mutation.type === 'childList') {
                    const addedNodes = [];
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            const id = Number(node.getAttribute('data-sr-id') || 0);
                            addedNodes.push({ id, html: node.outerHTML });
                        }
                    });
                    const removedNodes = [];
                    mutation.removedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            const id = Number(node.getAttribute('data-sr-id') || 0);
                            removedNodes.push({ id, tagName: node.tagName });
                        }
                    });
                    if (addedNodes.length > 0 || removedNodes.length > 0) {
                        this.emit('DOM_MUTATION', {
                            mutationType: 'childList',
                            targetId,
                            addedNodes,
                            removedNodes,
                        });
                    }
                }
                else if (mutation.type === 'attributes') {
                    const attrName = mutation.attributeName;
                    if (attrName && attrName !== 'data-sr-id') {
                        const newValue = mutation.target.getAttribute(attrName);
                        this.emit('DOM_MUTATION', {
                            mutationType: 'attributes',
                            targetId,
                            attributeName: attrName,
                            newValue,
                        });
                    }
                }
                else if (mutation.type === 'characterData') {
                    this.emit('DOM_MUTATION', {
                        mutationType: 'characterData',
                        targetId,
                        newValue: mutation.target.textContent,
                    });
                }
            });
        });
        this.observer.observe(document.documentElement, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
        });
    }
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    emit(type, data) {
        this.onMutation({
            id: Math.random().toString(36).substr(2, 9),
            type,
            timestamp: Date.now(),
            data,
        });
    }
}
//# sourceMappingURL=mutation-tracker.js.map