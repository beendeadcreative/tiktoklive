// Note names + a small chord namer, shared by the keys overlay and the panel.
(function (global) {
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Intervals above the root → chord suffix. Ordered most to least specific.
  const CHORDS = [
    [[0, 4, 7, 11, 14], 'maj9'],
    [[0, 3, 7, 10, 14], 'm9'],
    [[0, 4, 7, 10, 14], '9'],
    [[0, 4, 7, 11], 'maj7'],
    [[0, 3, 7, 10], 'm7'],
    [[0, 4, 7, 10], '7'],
    [[0, 3, 6, 10], 'm7♭5'],
    [[0, 3, 6, 9], 'dim7'],
    [[0, 3, 7, 11], 'm(maj7)'],
    [[0, 4, 7, 9], '6'],
    [[0, 3, 7, 9], 'm6'],
    [[0, 4, 7, 2], 'add9'],
    [[0, 3, 7, 2], 'm(add9)'],
    [[0, 4, 7], ''],
    [[0, 3, 7], 'm'],
    [[0, 3, 6], 'dim'],
    [[0, 4, 8], 'aug'],
    [[0, 2, 7], 'sus2'],
    [[0, 5, 7], 'sus4'],
    [[0, 7], '5'],
  ];

  const noteName = (midi) => NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  const pitchName = (midi) => NAMES[midi % 12];
  const isBlack = (midi) => [1, 3, 6, 8, 10].includes(midi % 12);

  function chordName(notes) {
    if (!notes || notes.length < 2) return '';
    const sorted = [...notes].sort((a, b) => a - b);
    const bass = sorted[0] % 12;
    const pcs = [...new Set(sorted.map((n) => n % 12))];
    if (pcs.length < 2) return '';

    // Try the bass note as root first so inversions read as slash chords
    // only when no root-position match exists.
    const roots = [bass, ...pcs.filter((p) => p !== bass)];
    for (const [intervals, suffix] of CHORDS) {
      if (intervals.length !== pcs.length) continue;
      for (const root of roots) {
        const set = new Set(pcs.map((p) => (p - root + 12) % 12));
        if (intervals.every((i) => set.has(i % 12))) {
          const name = NAMES[root] + suffix;
          return root === bass ? name : `${name}/${NAMES[bass]}`;
        }
      }
    }
    return '';
  }

  global.StudioMusic = { NAMES, noteName, pitchName, isBlack, chordName };
})(window);
