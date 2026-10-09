// Production breakdown control panel: chapters, spotlight + Before/After,
// pinned chat question. Connection, scenes, chapters (song map), countdown
// and timer live in control/panel-core.js.
(function () {
  const $ = (id) => document.getElementById(id);

  const panel = StudioPanel({
    app: 'breakdown-live',
    title: 'Breakdown Live',
    layout: BREAKDOWN_LAYOUT,
    defaults: {
      handle: '@yourhandle',
      song: 'Superpowers',
      version: '',
      stage: 'Production breakdown',
      bpm: '',
      key: '',
      timeSig: '',
      rec: false,
      sessionStart: null,
      sections: ['Intro', 'Drums', 'Bass', 'Chords & synths', 'Vocals', 'FX & transitions', 'Mix & master'].map((label) => ({ label, status: 'todo' })),
      spotlight: { title: '', detail: '', ab: '' },
      question: { user: '', text: '', show: false },
      plan: 'Breaking down every layer of Superpowers',
      countdownTo: null,
      brbText: '',
      recap: '',
      nextStream: '',
    },
    render(state) {
      $('abBefore').classList.toggle('on', state.spotlight.ab === 'before');
      $('abAfter').classList.toggle('on', state.spotlight.ab === 'after');
      $('qShow').classList.toggle('on', !!state.question.show);
      $('qShow').textContent = state.question.show ? 'Hide question' : 'Show question';
    },
  });
  const { state, changed } = panel;

  const setAb = (ab) => {
    state.spotlight.ab = ab;
    changed();
  };
  $('abBefore').onclick = () => setAb('before');
  $('abAfter').onclick = () => setAb('after');
  $('abOff').onclick = () => setAb('');

  $('qShow').onclick = () => {
    state.question.show = !state.question.show;
    changed();
  };
  $('qClear').onclick = () => {
    Object.assign(state.question, { user: '', text: '', show: false });
    document.querySelector('[data-k="question.user"]').value = '';
    document.querySelector('[data-k="question.text"]').value = '';
    changed();
  };

  // N = next chapter, B = flip Before/After (when you're not typing).
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'n') panel.nextSection();
    if (k === 'b') setAb(state.spotlight.ab === 'before' ? 'after' : 'before');
  });
})();
