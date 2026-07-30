export class NetworkTracker {
    constructor(onNetwork) {
        this.originalFetch = null;
        this.originalXHROpen = null;
        this.originalXHRSend = null;
        this.onNetwork = onNetwork;
    }
    start() {
        this.interceptFetch();
        this.interceptXHR();
    }
    stop() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
        }
        if (this.originalXHROpen) {
            XMLHttpRequest.prototype.open = this.originalXHROpen;
        }
        if (this.originalXHRSend) {
            XMLHttpRequest.prototype.send = this.originalXHRSend;
        }
    }
    interceptFetch() {
        if (!window.fetch)
            return;
        this.originalFetch = window.fetch;
        const self = this;
        window.fetch = async function (...args) {
            const startTime = Date.now();
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            const method = (args[1]?.method || 'GET').toUpperCase();
            // Don't intercept tracker endpoint POSTs to avoid infinite loops!
            if (url.includes('/api/reports')) {
                return self.originalFetch.apply(this, args);
            }
            try {
                const response = await self.originalFetch.apply(this, args);
                const duration = Date.now() - startTime;
                self.emit({
                    url,
                    method,
                    status: response.status,
                    statusText: response.statusText,
                    duration,
                    type: 'fetch',
                });
                return response;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                self.emit({
                    url,
                    method,
                    status: 0,
                    statusText: error?.message || 'Network Failure',
                    duration,
                    type: 'fetch',
                });
                throw error;
            }
        };
    }
    interceptXHR() {
        if (!window.XMLHttpRequest)
            return;
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;
        const self = this;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._sr_method = method;
            this._sr_url = String(url);
            return self.originalXHROpen.apply(this, [method, url, ...rest]);
        };
        XMLHttpRequest.prototype.send = function (...args) {
            const startTime = Date.now();
            const xhr = this;
            if (xhr._sr_url?.includes('/api/reports')) {
                return self.originalXHRSend.apply(this, args);
            }
            xhr.addEventListener('loadend', () => {
                const duration = Date.now() - startTime;
                self.emit({
                    url: xhr._sr_url || '',
                    method: (xhr._sr_method || 'GET').toUpperCase(),
                    status: xhr.status,
                    statusText: xhr.statusText,
                    duration,
                    type: 'xhr',
                });
            });
            return self.originalXHRSend.apply(this, args);
        };
    }
    emit(data) {
        this.onNetwork({
            id: Math.random().toString(36).substr(2, 9),
            type: 'NETWORK',
            timestamp: Date.now(),
            data,
        });
    }
}
//# sourceMappingURL=network-tracker.js.map