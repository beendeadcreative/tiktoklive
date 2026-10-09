// Shared control-panel engine used by the music panel (control/panel.html)
// and the gaming panel (gaming/panel.html).
//
//   const panel = StudioPanel({ app, defaults, layout, title, render });
//   (or `layouts: { 'Landscape 16:9': …, 'Vertical 9:16': … }` to offer a choice)
//   panel.state          — live state object; mutate it, then call panel.changed()
//   panel.changed()      — save + re-render + push state to overlays
//   panel.log(msg), panel.switchScene(n), panel.hotkey(i), panel.bus()
//
// Handles: OBS connection, scene buttons + 1–9 hotkeys, "Build scenes",
// data-k field binding, song map (state.sections), A/B vote, countdown and
// session timer (each only if its elements exist on the page).
(function (global) {
  const $ = (id) => document.getElementById(id);

  function load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function clock(ms) {
    const t = Math.floor(ms / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${Math.floor(t / 3600)}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  }

  function StudioPanel({ app, defaults, layout, layouts, title, render = () => {} }) {
    const STATE_KEY = app + '-panel-state';
    const CONN_KEY = 'studio-live-panel-conn'; // shared: same OBS for every template

    const saved = load(STATE_KEY, {});
    const state = { ...structuredClone(defaults), ...saved };
    if (defaults.vote) state.vote = { ...defaults.vote, ...(saved.vote || {}) };

    function log(msg) {
      const el = $('log');
      if (!el) return;
      el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
      el.scrollTop = el.scrollHeight;
    }

    // ── OBS connection ────────────────────────────────────────
    const cfg = global.STUDIO_CONFIG || {};
    const conn = load(CONN_KEY, { url: cfg.obsUrl, password: cfg.obsPassword || '' });
    $('obsUrl').value = conn.url || 'ws://127.0.0.1:4455';
    $('obsPassword').value = conn.password || '';

    let bus;
    function connect() {
      if (bus) {
        clearTimeout(bus.retryTimer);
        if (bus.ws) {
          bus.ws.onclose = null;
          bus.ws.close();
        }
      }
      bus = new ObsBus({
        url: $('obsUrl').value.trim(),
        password: $('obsPassword').value,
        app,
        subscriptions: ObsBus.SUB.General | ObsBus.SUB.Scenes,
        onStatus: setStatus,
      });
      bus.on('_ready', () => {
        log('Connected to OBS');
        broadcast();
        refreshScenes();
      });
      bus.on('hello', () => broadcast());
      bus.on('obs:CurrentProgramSceneChanged', ({ sceneName }) => markLive(sceneName));
      for (const evt of ['SceneCreated', 'SceneRemoved', 'SceneNameChanged', 'SceneListChanged']) {
        bus.on('obs:' + evt, () => refreshScenes());
      }
      bus.connect();
    }

    function setStatus(status) {
      const el = $('status');
      const text = {
        connecting: 'Connecting…',
        connected: 'Connected to OBS',
        disconnected: 'OBS not reachable — is OBS open with WebSocket enabled?',
        'auth-failed': 'Wrong WebSocket password',
      }[status] || status;
      el.querySelector('span').textContent = text;
      el.className = 'status ' + (status === 'connected' ? 'connected' : status === 'connecting' ? '' : 'error');
    }

    $('reconnect').onclick = () => {
      save(CONN_KEY, { url: $('obsUrl').value.trim(), password: $('obsPassword').value });
      connect();
    };

    // Templates with more than one layout get a picker next to "Build scenes".
    const LAYOUT_KEY = app + '-panel-layout';
    let pick;
    if (layouts) {
      pick = document.createElement('select');
      pick.id = 'layoutPick';
      for (const name of Object.keys(layouts)) pick.add(new Option(name, name));
      pick.value = load(LAYOUT_KEY, null) in layouts ? load(LAYOUT_KEY, null) : Object.keys(layouts)[0];
      pick.onchange = () => save(LAYOUT_KEY, pick.value);
      $('build').before(pick);
    }

    $('build').onclick = async () => {
      const chosen = layouts ? layouts[pick.value] : layout;
      const label = layouts ? `${title} (${pick.value})` : title;
      if (!confirm(`Create the ${label} scenes in the current OBS scene collection? Existing scenes/sources with the same names are left alone. Use a fresh scene collection for each layout.`)) return;
      try {
        // Panels live one folder below the repo root.
        await StudioScenes.buildScenes(bus, new URL('../', location.href).href, log, chosen);
        refreshScenes();
      } catch (err) {
        log('✗ Build failed: ' + err.message);
      }
    };

    // ── Scenes ────────────────────────────────────────────────
    // hotkeys[n] = scene switched by key n+1. Scenes named "3 · Something" claim
    // their number; if none are numbered, keys follow the OBS list order.
    let hotkeys = [];
    async function refreshScenes() {
      try {
        const { scenes, currentProgramSceneName } = await bus.request('GetSceneList');
        // obs-websocket numbers scenes bottom-up; sort to match the OBS list.
        let names = scenes.sort((a, b) => b.sceneIndex - a.sceneIndex).map((s) => s.sceneName);
        const numbered = names.filter((n) => /^[1-9]\s*·/.test(n)).sort();
        names = [...numbered, ...names.filter((n) => !numbered.includes(n))];
        hotkeys = [];
        if (numbered.length) numbered.forEach((n) => (hotkeys[+n[0] - 1] ??= n));
        else hotkeys = names.slice(0, 9);
        $('scenes').innerHTML = '';
        names.forEach((name) => {
          const btn = document.createElement('button');
          const key = hotkeys.indexOf(name);
          btn.textContent = (key >= 0 ? `[${key + 1}]  ` : '') + name.replace(/^[1-9]\s*·\s*/, '');
          btn.dataset.scene = name;
          btn.onclick = () => switchScene(name);
          $('scenes').appendChild(btn);
        });
        markLive(currentProgramSceneName);
      } catch (err) {
        log('Could not list scenes: ' + err.message);
      }
    }
    function markLive(name) {
      for (const btn of $('scenes').querySelectorAll('button')) btn.classList.toggle('live', btn.dataset.scene === name);
    }
    function switchScene(name) {
      if (name) bus.request('SetCurrentProgramScene', { sceneName: name }).catch((err) => log(err.message));
    }

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[1-9]$/.test(e.key)) switchScene(hotkeys[+e.key - 1]);
    });

    // ── State → overlays ──────────────────────────────────────
    let broadcastTimer;
    function changed() {
      save(STATE_KEY, state);
      renderAll();
      clearTimeout(broadcastTimer);
      broadcastTimer = setTimeout(broadcast, 60);
    }
    function broadcast() {
      if (bus && bus.ready) bus.send('state', state);
    }

    // Simple fields: data-k="game" or data-k="vote.question"
    for (const el of document.querySelectorAll('[data-k]')) {
      const path = el.dataset.k.split('.');
      el.value = path.reduce((o, k) => o?.[k], state) ?? '';
      el.addEventListener('input', () => {
        const obj = path.slice(0, -1).reduce((o, k) => o[k], state);
        obj[path.at(-1)] = el.value;
        changed();
      });
    }

    const onClick = (id, fn) => {
      if ($(id)) $(id).onclick = () => {
        fn();
        changed();
      };
    };

    // Session timer
    onClick('timerStart', () => (state.sessionStart = Date.now()));
    onClick('timerReset', () => (state.sessionStart = null));
    if ($('timer')) {
      setInterval(() => {
        $('timer').textContent = state.sessionStart ? clock(Date.now() - state.sessionStart) : '';
      }, 500);
    }

    // Vote
    for (const btn of document.querySelectorAll('[data-vote]')) {
      btn.onclick = () => {
        const k = btn.dataset.vote;
        state.vote[k] = Math.max(0, (+state.vote[k] || 0) + +btn.dataset.d);
        changed();
      };
    }
    onClick('voteShow', () => (state.vote.active = !state.vote.active));
    onClick('voteReveal', () => (state.vote.reveal = !state.vote.reveal));
    onClick('voteReset', () => Object.assign(state.vote, { countA: 0, countB: 0, reveal: false }));

    // Song map / chapters: click cycles todo → active → done
    const NEXT_STATUS = { todo: 'active', active: 'done', done: 'todo' };
    function renderSections() {
      const wrap = $('sections');
      wrap.innerHTML = '';
      state.sections.forEach((sec, i) => {
        const btn = document.createElement('button');
        btn.className = 'sec ' + sec.status;
        btn.textContent = (sec.status === 'done' ? '✓ ' : '') + sec.label;
        btn.onclick = () => {
          if (NEXT_STATUS[sec.status] === 'active') state.sections.forEach((s) => s.status === 'active' && (s.status = 'done'));
          sec.status = NEXT_STATUS[sec.status];
          changed();
        };
        const x = document.createElement('span');
        x.className = 'x';
        x.textContent = '×';
        x.title = 'Remove';
        x.onclick = (e) => {
          e.stopPropagation();
          state.sections.splice(i, 1);
          changed();
        };
        btn.appendChild(x);
        wrap.appendChild(btn);
      });
    }
    function addSection() {
      const label = $('newSection').value.trim();
      if (!label) return;
      state.sections.push({ label, status: 'todo' });
      $('newSection').value = '';
      changed();
    }
    function nextSection() {
      const i = state.sections.findIndex((s) => s.status === 'active');
      if (i >= 0) state.sections[i].status = 'done';
      const next = state.sections.findIndex((s, j) => j > i && s.status === 'todo');
      if (next >= 0) state.sections[next].status = 'active';
      changed();
    }
    if ($('sections')) {
      $('addSection').onclick = addSection;
      $('newSection').addEventListener('keydown', (e) => e.key === 'Enter' && addSection());
      $('nextSection').onclick = nextSection;
    }

    // Countdown
    onClick('countStart', () => (state.countdownTo = Date.now() + Math.max(1, +$('countMin').value || 5) * 60000));
    onClick('countClear', () => (state.countdownTo = null));

    function renderAll() {
      if (state.vote && $('voteShow')) {
        $('voteShow').classList.toggle('on', !!state.vote.active);
        $('voteShow').textContent = state.vote.active ? 'Hide vote' : 'Show vote';
        $('voteReveal').classList.toggle('on', !!state.vote.reveal);
        $('countA').textContent = state.vote.countA || 0;
        $('countB').textContent = state.vote.countB || 0;
      }
      if ($('sections')) renderSections();
      render(state);
    }

    // Start once the page script has registered its own handlers.
    queueMicrotask(() => {
      renderAll();
      connect();
    });

    return {
      state,
      changed,
      log,
      switchScene,
      nextSection,
      hotkey: (i) => hotkeys[i],
      bus: () => bus,
    };
  }

  global.StudioPanel = StudioPanel;
})(window);
