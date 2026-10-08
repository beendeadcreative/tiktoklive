// Minimal obs-websocket v5 client.
//
// Everything talks through OBS itself: the control panel calls
// BroadcastCustomEvent and every overlay (a browser source) receives it as a
// CustomEvent. No extra server or install is needed — just OBS 28+ with the
// WebSocket server enabled.
(function (global) {
  const SUB = { General: 1 << 0, Scenes: 1 << 2, Inputs: 1 << 3 };

  async function sha256b64(text) {
    const bytes = new TextEncoder().encode(text);
    // crypto.subtle only exists in "secure" pages; OBS's local-file mode isn't one.
    const digest = global.crypto && crypto.subtle
      ? new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
      : sha256(bytes);
    return btoa(String.fromCharCode(...digest));
  }

  // Plain-JS SHA-256 fallback (only used when crypto.subtle is unavailable).
  function sha256(msg) {
    const K = [];
    const H = [];
    const frac = (x) => ((x - Math.floor(x)) * 2 ** 32) >>> 0;
    for (let n = 2, found = 0; found < 64; n++) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      if (!prime) continue;
      if (found < 8) H.push(frac(Math.sqrt(n)));
      K.push(frac(Math.cbrt(n)));
      found++;
    }
    const len = msg.length;
    const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(msg);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 4, len * 8);
    view.setUint32(padded.length - 8, Math.floor((len * 8) / 2 ** 32));
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const w = new Uint32Array(64);
    for (let off = 0; off < padded.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) >>> 0, c, b, a, (t1 + t2) >>> 0];
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) >>> 0));
    }
    const out = new Uint8Array(32);
    H.forEach((v, i) => new DataView(out.buffer).setUint32(i * 4, v));
    return out;
  }

  class ObsBus {
    // `app` namespaces messages so the music and gaming templates never
    // cross-talk, even when both are open against the same OBS.
    constructor({ url, password = '', app = 'studio-live', subscriptions = SUB.General, onStatus } = {}) {
      this.app = app;
      this.url = url || 'ws://127.0.0.1:4455';
      this.password = password;
      this.subscriptions = subscriptions;
      this.onStatus = onStatus || (() => {});
      this.id = Math.random().toString(36).slice(2);
      this.handlers = {};
      this.pending = new Map();
      this.nextRequest = 1;
      this.ready = false;
      this.retryMs = 1000;
    }

    connect() {
      clearTimeout(this.retryTimer);
      if (this.ws) {
        this.ws.onclose = null;
        this.ws.close();
      }
      this.onStatus('connecting');
      let ws;
      try {
        ws = new WebSocket(this.url);
      } catch (err) {
        this.onStatus('disconnected', err);
        return this._scheduleRetry();
      }
      this.ws = ws;
      ws.onmessage = (msg) => this._onMessage(JSON.parse(msg.data));
      ws.onerror = () => {};
      ws.onclose = (evt) => {
        this.ready = false;
        for (const { reject } of this.pending.values()) reject(new Error('Disconnected'));
        this.pending.clear();
        // 4009 = AuthenticationFailed
        this.onStatus(evt.code === 4009 ? 'auth-failed' : 'disconnected', evt);
        this._scheduleRetry();
      };
    }

    _scheduleRetry() {
      this.retryTimer = setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 1.5, 10000);
    }

    async _onMessage({ op, d }) {
      if (op === 0) {
        // Hello → Identify
        const identify = { rpcVersion: 1, eventSubscriptions: this.subscriptions };
        if (d.authentication) {
          const { challenge, salt } = d.authentication;
          const secret = await sha256b64(this.password + salt);
          identify.authentication = await sha256b64(secret + challenge);
        }
        this.ws.send(JSON.stringify({ op: 1, d: identify }));
      } else if (op === 2) {
        // Identified
        this.ready = true;
        this.retryMs = 1000;
        this.onStatus('connected');
        this._emit('_ready');
      } else if (op === 5) {
        if (d.eventType === 'CustomEvent') {
          const data = d.eventData || {};
          if (data.app === this.app && data.from !== this.id) this._emit(data.type, data.payload);
        } else {
          this._emit('obs:' + d.eventType, d.eventData || {});
        }
      } else if (op === 7) {
        const pending = this.pending.get(d.requestId);
        if (!pending) return;
        this.pending.delete(d.requestId);
        const status = d.requestStatus || {};
        if (status.result) {
          pending.resolve(d.responseData || {});
        } else {
          const err = new Error(status.comment || `Request failed (${status.code})`);
          err.code = status.code;
          pending.reject(err);
        }
      }
    }

    on(type, fn) {
      (this.handlers[type] = this.handlers[type] || []).push(fn);
      return this;
    }

    _emit(type, payload) {
      for (const fn of this.handlers[type] || []) fn(payload);
    }

    request(requestType, requestData = {}) {
      if (!this.ready) return Promise.reject(new Error('Not connected to OBS'));
      const requestId = String(this.nextRequest++);
      return new Promise((resolve, reject) => {
        this.pending.set(requestId, { resolve, reject });
        this.ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } }));
      });
    }

    // Send a message to every other overlay / panel connected to OBS.
    send(type, payload) {
      return this.request('BroadcastCustomEvent', {
        eventData: { app: this.app, from: this.id, type, payload },
      }).catch(() => {});
    }
  }

  ObsBus.SUB = SUB;
  global.ObsBus = ObsBus;
})(window);
