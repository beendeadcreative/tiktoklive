// Music control panel: session card, song map, lyrics, vote, MIDI keys.
// Connection, scenes, vote, countdown and timer live in panel-core.js.
(function () {
  const $ = (id) => document.getElementById(id);

  const panel = StudioPanel({
    app: 'studio-live',
    title: 'Studio Live (music)',
    layout: StudioScenes.MUSIC,
    defaults: {
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
    },
    render(state) {
      $('rec').classList.toggle('on', !!state.rec);
      renderSections(state);
    },
  });
  const { state, changed } = panel;

  $('rec').onclick = () => {
    state.rec = !state.rec;
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
      const bus = panel.bus();
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
      if ($('midiPc').checked && d1 < 9) panel.switchScene(panel.hotkey(d1));
      return;
    } else {
      return;
    }
    sendNotes();
  }

  $('midiEnable').onclick = async () => {
    if (!navigator.requestMIDIAccess) {
      panel.log('Web MIDI is not available in this browser — open the panel in Chrome or Edge.');
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
      panel.log(`MIDI enabled (${access.inputs.size} input${access.inputs.size === 1 ? '' : 's'})`);
    } catch (err) {
      panel.log('MIDI permission denied: ' + err.message);
    }
  };
})();
