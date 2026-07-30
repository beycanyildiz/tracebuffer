/**
 * Session Replayer Engine
 * Recreates DOM snapshot inside iframe and replays recorded time-series events.
 */
class SessionReplayer {
  constructor(iframeElement, cursorElement, progressSlider, timeDisplay) {
    this.iframe = iframeElement;
    this.cursor = cursorElement;
    this.progressSlider = progressSlider;
    this.timeDisplay = timeDisplay;

    this.payload = null;
    this.events = [];
    this.isPlaying = false;
    this.currentStep = 0;
    this.playbackSpeed = 1;
    this.animationFrameId = null;
    this.startTime = 0;
    this.duration = 0;
  }

  loadPayload(payload) {
    this.pause();
    this.payload = payload;
    this.events = payload.events || [];
    this.currentStep = 0;

    if (this.events.length > 0) {
      this.startTime = this.events[0].timestamp;
      this.duration = this.events[this.events.length - 1].timestamp - this.startTime;
      if (this.duration === 0) this.duration = 1000;
    } else {
      this.startTime = payload.timestamp;
      this.duration = 1000;
    }

    if (this.progressSlider) {
      this.progressSlider.max = this.duration;
      this.progressSlider.value = 0;
    }

    this.renderInitialSnapshot();
    this.updateTimeDisplay(0);
  }

  renderInitialSnapshot() {
    if (!this.payload?.initialSnapshot || !this.iframe) return;

    const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
    doc.open();
    
    // Construct HTML string from VNode
    const htmlContent = this.vnodeToHTML(this.payload.initialSnapshot);
    doc.write(`<!DOCTYPE html><html>${htmlContent}</html>`);
    doc.close();

    // Set viewport dimensions
    if (this.payload.viewport) {
      this.iframe.style.width = `${this.payload.viewport.width}px`;
      this.iframe.style.height = `${this.payload.viewport.height}px`;
    }
  }

  vnodeToHTML(vnode) {
    if (typeof vnode === 'string') {
      return this.escapeHTML(vnode);
    }
    if (!vnode) return '';

    const attrs = Object.entries(vnode.attributes || {})
      .map(([k, v]) => `${k}="${this.escapeHTML(String(v))}"`)
      .join(' ');

    const children = (vnode.children || [])
      .map(child => this.vnodeToHTML(child))
      .join('');

    const selfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    if (selfClosing.includes(vnode.tagName?.toLowerCase())) {
      return `<${vnode.tagName} ${attrs} />`;
    }

    return `<${vnode.tagName} ${attrs}>${children}</${vnode.tagName}>`;
  }

  play() {
    if (this.isPlaying || !this.payload) return;
    this.isPlaying = true;
    let lastTime = performance.now();

    const loop = (now) => {
      if (!this.isPlaying) return;

      const delta = (now - lastTime) * this.playbackSpeed;
      lastTime = now;

      let currentTime = Number(this.progressSlider.value) + delta;

      if (currentTime >= this.duration) {
        currentTime = this.duration;
        this.pause();
      }

      this.progressSlider.value = currentTime;
      this.updateTimeDisplay(currentTime);
      this.applyEventsUpToTime(currentTime);

      if (this.isPlaying) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  seek(targetTimeMs) {
    this.pause();
    this.progressSlider.value = targetTimeMs;
    this.updateTimeDisplay(targetTimeMs);
    this.renderInitialSnapshot();
    this.currentStep = 0;
    this.applyEventsUpToTime(targetTimeMs);
  }

  setSpeed(speed) {
    this.playbackSpeed = speed;
  }

  applyEventsUpToTime(timeOffsetMs) {
    const targetTimestamp = this.startTime + timeOffsetMs;

    while (this.currentStep < this.events.length) {
      const event = this.events[this.currentStep];
      if (event.timestamp > targetTimestamp) break;

      this.executeEvent(event);
      this.currentStep++;
    }
  }

  executeEvent(event) {
    const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;

    switch (event.type) {
      case 'MOUSE_MOVE':
        if (this.cursor && event.data) {
          this.cursor.style.left = `${event.data.x}px`;
          this.cursor.style.top = `${event.data.y}px`;
          this.cursor.style.display = 'block';
        }
        break;

      case 'CLICK':
        if (event.data && this.cursor) {
          this.cursor.style.left = `${event.data.x}px`;
          this.cursor.style.top = `${event.data.y}px`;
          this.triggerClickRipple(event.data.x, event.data.y);
        }
        break;

      case 'INPUT':
        if (event.data?.targetId) {
          const el = doc.querySelector(`[data-sr-id="${event.data.targetId}"]`);
          if (el) {
            el.value = event.data.value;
          }
        }
        break;

      case 'SCROLL':
        if (event.data && this.iframe.contentWindow) {
          this.iframe.contentWindow.scrollTo(event.data.scrollX, event.data.scrollY);
        }
        break;

      case 'DOM_MUTATION':
        this.applyDomMutation(doc, event.data);
        break;
    }
  }

  applyDomMutation(doc, data) {
    if (!data) return;

    if (data.mutationType === 'attributes' && data.targetId && data.attributeName) {
      const target = doc.querySelector(`[data-sr-id="${data.targetId}"]`);
      if (target) {
        if (data.newValue === null) {
          target.removeAttribute(data.attributeName);
        } else {
          target.setAttribute(data.attributeName, data.newValue);
        }
      }
    } else if (data.mutationType === 'characterData' && data.targetId) {
      const target = doc.querySelector(`[data-sr-id="${data.targetId}"]`);
      if (target) {
        target.textContent = data.newValue;
      }
    }
  }

  triggerClickRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = `${x - 15}px`;
    ripple.style.top = `${y - 15}px`;
    const container = this.iframe.parentElement;
    if (container) {
      container.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }

  updateTimeDisplay(ms) {
    if (!this.timeDisplay) return;
    const currentSec = (ms / 1000).toFixed(1);
    const totalSec = (this.duration / 1000).toFixed(1);
    this.timeDisplay.textContent = `${currentSec}s / ${totalSec}s`;
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
