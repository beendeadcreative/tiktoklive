// Shared plumbing for every overlay page.
//
//   StudioOverlay({ render(state), onNotes(notes), tick(state), app, demoState })
//
// - Receives session state from the control panel through OBS.
// - Caches the last state so a reloaded browser source isn't blank.
// - Add #demo to the URL to preview with sample data (no OBS needed).
// - Add ?app=game-live to the URL to listen to the gaming panel instead.
(function (global) {

  const DEMO_STATE = {
    handle: '@yourhandle',
    song: 'Neon Porch Light',
    version: 'Demo v3',
    bpm: 92,
    key: 'F# minor',
    timeSig: '4/4',
    stage: 'Arranging',
    rec: true,
    sessionStart: Date.now() - (47 * 60 + 12) * 1000,
    sections: [
      { label: 'Intro', status: 'done' },
      { label: 'Verse 1', status: 'done' },
      { label: 'Chorus', status: 'active' },
      { label: 'Verse 2', status: 'todo' },
      { label: 'Bridge', status: 'todo' },
      { label: 'Outro', status: 'todo' },
    ],
    lyrics:
      "Left the porch light on for you\nburning like a question mark\nevery moth in town knows\nwhat I'm waiting for\n\nAnd I don't mind the static\nI don't mind the dark",
    vote: {
      active: true,
      question: 'Which snare for the chorus?',
      a: 'Tight 808 rim',
      b: 'Dusty vinyl clap',
      countA: 34,
      countB: 51,
      reveal: false,
    },
    plan: 'Finishing the chorus + picking drums with chat',
    countdownTo: Date.now() + 4 * 60 * 1000 + 30 * 1000,
    brbText: 'Bouncing the chorus — back in 2',
    recap: 'Wrote verse 2 · picked the snare · rough mix of the chorus',
    nextStream: 'Thursday 8pm ET — mixing night',
  };

  const DEMO_NOTES = [54, 57, 61, 66];

  // Per-template tweaks to the sample data, so shared overlays preview with
  // the right content when opened with ?app=…#demo.
  const APP_DEMOS = {
    'breakdown-live': {
      song: 'Superpowers',
      version: '',
      stage: 'Production breakdown',
      bpm: 104,
      key: 'A minor',
      rec: false,
      sections: ['Intro', 'Drums', 'Bass', 'Synths', 'Vocals', 'FX', 'Mix'].map((label, i) => ({
        label,
        status: i < 2 ? 'done' : i === 2 ? 'active' : 'todo',
      })),
      plan: 'Breaking down every layer of Superpowers',
      brbText: 'Bouncing stems — back in 2',
      recap: 'Drums, the reese bass, vocal chain + mix bus',
      nextStream: 'Thursday 8pm ET — making the remix',
    },
  };

  function readCache(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, state) {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }

  function StudioOverlay({ render, onNotes, tick, app, demoState }) {
    app = new URLSearchParams(location.search).get('app') || app || 'studio-live';
    const cacheKey = app + '-overlay-state';
    const demo = location.hash === '#demo';
    const cfg = global.STUDIO_CONFIG || {};
    let state = demo ? { ...DEMO_STATE, ...APP_DEMOS[app], ...demoState } : readCache(cacheKey);
    if (demo) document.documentElement.classList.add('demo');

    const draw = () => {
      if (!state) return;
      render(state);
      if (tick) tick(state);
    };
    draw();
    if (demo && onNotes) onNotes(DEMO_NOTES);
    if (tick) setInterval(() => state && tick(state), 250);
    if (demo) return;

    const bus = new ObsBus({ url: cfg.obsUrl, password: cfg.obsPassword, app });
    bus.on('_ready', () => bus.send('hello'));
    bus.on('state', (s) => {
      state = s;
      writeCache(cacheKey, s);
      draw();
    });
    if (onNotes) bus.on('notes', (notes) => onNotes(notes || []));
    bus.connect();
  }

  // Helpers used by several overlays.
  StudioOverlay.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  StudioOverlay.clock = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  StudioOverlay.DEMO_STATE = DEMO_STATE;
  global.StudioOverlay = StudioOverlay;
})(window);
