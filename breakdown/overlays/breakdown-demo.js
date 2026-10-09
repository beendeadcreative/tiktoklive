// Sample data for previewing breakdown overlays with #demo (no OBS needed).
window.BREAKDOWN_DEMO = {
  handle: '@yourhandle',
  song: 'Superpowers',
  version: '',
  stage: 'Production breakdown',
  bpm: 104,
  key: 'A minor',
  timeSig: '4/4',
  rec: false,
  sessionStart: Date.now() - (38 * 60 + 4) * 1000,
  sections: [
    { label: 'Intro', status: 'done' },
    { label: 'Drums', status: 'done' },
    { label: 'Bass', status: 'active' },
    { label: 'Synths', status: 'todo' },
    { label: 'Vocals', status: 'todo' },
    { label: 'FX', status: 'todo' },
    { label: 'Mix', status: 'todo' },
  ],
  spotlight: {
    title: 'Sub bass + reese layer',
    detail: 'Operator sine → Saturator → OTT at 30% · sidechained to the kick',
    ab: 'after',
  },
  question: { user: '@chatfriend', text: 'How do you keep the sub and kick from fighting?', show: true },
};
