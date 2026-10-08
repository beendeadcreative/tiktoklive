// Gaming control panel: game card, counters, goal, vote.
// Connection, scenes, vote, countdown and timer live in control/panel-core.js.
(function () {
  const $ = (id) => document.getElementById(id);
  const COUNTER_KEYS = ['q', 'w', 'e'];

  const panel = StudioPanel({
    app: 'game-live',
    title: 'Game Live',
    layout: GAME_LAYOUT,
    defaults: {
      handle: '@yourhandle',
      game: '',
      platform: 'PS5',
      status: '',
      sessionStart: null,
      counters: [
        { label: 'Deaths', value: 0 },
        { label: 'Wins', value: 0 },
        { label: '', value: 0 },
      ],
      goal: { label: '', current: 0, target: '' },
      vote: { active: false, question: '', a: '', b: '', countA: 0, countB: 0, reveal: false },
      plan: '',
      countdownTo: null,
      brbText: '',
      recap: '',
      nextStream: '',
    },
    render(state) {
      state.counters.forEach((c, i) => ($('cv' + i).textContent = c.value || 0));
      $('goalCurrent').textContent = state.goal.current || 0;
    },
  });
  const { state, changed } = panel;

  // Counter rows: editable name, −, value, +
  state.counters.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'counter-row';
    row.innerHTML = `
      <input placeholder="Counter ${i + 1} name" title="Hotkey: ${COUNTER_KEYS[i].toUpperCase()}">
      <button data-d="-1">−</button>
      <b id="cv${i}">0</b>
      <button data-d="1" class="plus">+</button>`;
    const input = row.querySelector('input');
    input.value = c.label;
    input.addEventListener('input', () => {
      c.label = input.value;
      changed();
    });
    for (const btn of row.querySelectorAll('button')) btn.onclick = () => bump(i, +btn.dataset.d);
    $('counters').appendChild(row);
  });

  function bump(i, d) {
    const c = state.counters[i];
    c.value = Math.max(0, (+c.value || 0) + d);
    changed();
  }

  $('countersReset').onclick = () => {
    if (!confirm('Reset all counters to 0?')) return;
    state.counters.forEach((c) => (c.value = 0));
    changed();
  };

  for (const btn of document.querySelectorAll('[data-goal]')) {
    btn.onclick = () => {
      state.goal.current = Math.max(0, (+state.goal.current || 0) + +btn.dataset.goal);
      changed();
    };
  }

  // Q / W / E bump counters 1–3 (Shift subtracts) when you're not typing.
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = COUNTER_KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0) bump(i, e.shiftKey ? -1 : 1);
  });
})();
