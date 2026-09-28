// Shared plumbing for every overlay page.
//
//   StudioOverlay({ render(state), onNotes(notes), tick(state) })
//
// - Receives session state from the control panel through OBS.
// - Caches the last state so a reloaded browser source isn't blank.
// - Add #demo to the URL to preview with sample data (no OBS needed).
(function (global) {
  const CACHE_KEY = 'studio-live-overlay-state';

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

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(state) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function StudioOverlay({ render, onNotes, tick }) {
    const demo = location.hash === '#demo';
    const cfg = global.STUDIO_CONFIG || {};
    let state = demo ? DEMO_STATE : readCache();
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

    const bus = new ObsBus({ url: cfg.obsUrl, password: cfg.obsPassword });
    bus.on('_ready', () => bus.send('hello'));
    bus.on('state', (s) => {
      state = s;
      writeCache(s);
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
