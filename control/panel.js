// Control panel: edits session state and pushes it to every overlay via OBS.
(function () {
  const STATE_KEY = 'studio-live-panel-state';
  const CONN_KEY = 'studio-live-panel-conn';
  const $ = (id) => document.getElementById(id);

  const DEFAULT_STATE = {
    handle: '@yourhandle',
    song: '',
    version: 'Demo v1',
    bpm: '',
    key: '',
    timeSig: '4/4',
    stage: 'Writing',
    rec: false,
    sessionStart: null,
    sections: ['Intro', 'Verse 1', 'Pre-chorus', 'Chorus', 'Verse 2', 'Bridge', 'Outro'].map((label) => ({ label, status: 'todo' })),
    lyrics: '',
    vote: { active: false, question: '', a: '', b: '', countA: 0, countB: 0, reveal: false },
    plan: '',
    countdownTo: null,
    brbText: '',
    recap: '',
    nextStream: '',
  };

  let state = load(STATE_KEY, DEFAULT_STATE);
  state = { ...DEFAULT_STATE, ...state, vote: { ...DEFAULT_STATE.vote, ...(state.vote || {}) } };

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

  function log(msg) {
    const el = $('log');
    el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
    el.scrollTop = el.scrollHeight;
  }

  // ── OBS connection ──────────────────────────────────────────
  const cfg = window.STUDIO_CONFIG || {};
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

  $('build').onclick = async () => {
    if (!confirm('Create the Studio Live scenes in the current OBS scene collection? Existing scenes/sources with the same names are left alone.')) return;
    try {
      await StudioScenes.buildScenes(bus, new URL('../overlays/', location.href).href, log);
      refreshScenes();
    } catch (err) {
      log('✗ Build failed: ' + err.message);
    }
  };

  // ── Scenes ──────────────────────────────────────────────────
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

  // ── State → overlays ────────────────────────────────────────
  let broadcastTimer;
  function changed() {
    save(STATE_KEY, state);
    renderPanel();
    clearTimeout(broadcastTimer);
    broadcastTimer = setTimeout(broadcast, 60);
  }
  function broadcast() {
    if (bus && bus.ready) bus.send('state', state);
  }

  // Simple fields: data-k="song" or data-k="vote.question"
  for (const el of document.querySelectorAll('[data-k]')) {
    const path = el.dataset.k.split('.');
    const get = () => path.reduce((o, k) => o?.[k], state);
    el.value = get() ?? '';
    el.addEventListener('input', () => {
      const obj = path.slice(0, -1).reduce((o, k) => o[k], state);
      obj[path.at(-1)] = el.value;
      changed();
    });
  }

  $('rec').onclick = () => {
    state.rec = !state.rec;
    changed();
  };
  $('timerStart').onclick = () => {
    state.sessionStart = Date.now();
    changed();
  };
  $('timerReset').onclick = () => {
    state.sessionStart = null;
    changed();
  };

  // Song map
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
  $('addSection').onclick = addSection;
  $('newSection').addEventListener('keydown', (e) => e.key === 'Enter' && addSection());
  $('nextSection').onclick = () => {
    const i = state.sections.findIndex((s) => s.status === 'active');
    if (i >= 0) state.sections[i].status = 'done';
    const next = state.sections.findIndex((s, j) => j > i && s.status === 'todo');
    if (next >= 0) state.sections[next].status = 'active';
    changed();
  };

  // Vote
  for (const btn of document.querySelectorAll('[data-vote]')) {
    btn.onclick = () => {
      const k = btn.dataset.vote;
      state.vote[k] = Math.max(0, (+state.vote[k] || 0) + +btn.dataset.d);
      changed();
    };
  }
  $('voteShow').onclick = () => {
    state.vote.active = !state.vote.active;
    changed();
  };
  $('voteReveal').onclick = () => {
    state.vote.reveal = !state.vote.reveal;
    changed();
  };
  $('voteReset').onclick = () => {
    Object.assign(state.vote, { countA: 0, countB: 0, reveal: false });
    changed();
  };

  // Countdown
  $('countStart').onclick = () => {
    state.countdownTo = Date.now() + Math.max(1, +$('countMin').value || 5) * 60000;
    changed();
  };
  $('countClear').onclick = () => {
    state.countdownTo = null;
    changed();
  };

  function renderPanel() {
    $('rec').classList.toggle('on', !!state.rec);
    $('voteShow').classList.toggle('on', !!state.vote.active);
    $('voteShow').textContent = state.vote.active ? 'Hide vote' : 'Show vote';
    $('voteReveal').classList.toggle('on', !!state.vote.reveal);
    $('countA').textContent = state.vote.countA || 0;
    $('countB').textContent = state.vote.countB || 0;
    renderSections();
  }
  setInterval(() => {
    $('timer').textContent = state.sessionStart ? StudioOverlayClock(Date.now() - state.sessionStart) : '';
  }, 500);
  function StudioOverlayClock(ms) {
    const t = Math.floor(ms / 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${Math.floor(t / 3600)}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  }

  // ── MIDI ────────────────────────────────────────────────────
  const held = new Set();
  const sustained = new Set();
  let pedal = false;
  let notesTimer;

  function sendNotes() {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      const notes = [...new Set([...held, ...sustained])].sort((a, b) => a - b);
      $('chord').textContent = StudioMusic.chordName(notes);
      $('notes').textContent = notes.length ? notes.map(StudioMusic.noteName).join(' ') : 'No notes';
      if (bus && bus.ready) bus.send('notes', notes);
    }, 25);
  }

  function onMidi(e) {
    const selected = $('midiInput').value;
    if (selected && e.target.id !== selected) return;
    const [status, d1, d2] = e.data;
    const type = status & 0xf0;
    if (type === 0x90 && d2 > 0) {
      held.add(d1);
      sustained.delete(d1);
    } else if (type === 0x80 || (type === 0x90 && d2 === 0)) {
      held.delete(d1);
      if (pedal) sustained.add(d1);
    } else if (type === 0xb0 && d1 === 64) {
      pedal = d2 >= 64;
      if (!pedal) sustained.clear();
    } else if (type === 0xc0) {
      if ($('midiPc').checked && d1 < 9) switchScene(hotkeys[d1]);
      return;
    } else {
      return;
    }
    sendNotes();
  }

  $('midiEnable').onclick = async () => {
    if (!navigator.requestMIDIAccess) {
      log('Web MIDI is not available in this browser — open the panel in Chrome or Edge.');
      return;
    }
    try {
      const access = await navigator.requestMIDIAccess();
      const list = () => {
        const current = $('midiInput').value;
        $('midiInput').innerHTML = '<option value="">All inputs</option>';
        for (const input of access.inputs.values()) {
          input.onmidimessage = onMidi;
          $('midiInput').add(new Option(input.name, input.id, false, input.id === current));
        }
      };
      list();
      access.onstatechange = list;
      $('midiEnable').textContent = 'MIDI on';
      $('midiEnable').classList.add('accent');
      log(`MIDI enabled (${access.inputs.size} input${access.inputs.size === 1 ? '' : 's'})`);
    } catch (err) {
      log('MIDI permission denied: ' + err.message);
    }
  };

  renderPanel();
  connect();
})();
