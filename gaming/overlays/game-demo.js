// Sample data for previewing gaming overlays with #demo (no OBS needed).
window.GAME_DEMO = {
  handle: '@yourhandle',
  game: 'Elden Ring',
  platform: 'PS5',
  status: 'First playthrough · Limgrave',
  sessionStart: Date.now() - (1 * 3600 + 23 * 60 + 9) * 1000,
  counters: [
    { label: 'Deaths', value: 27 },
    { label: 'Bosses', value: 3 },
    { label: 'Rage quits', value: 1 },
  ],
  goal: { label: 'Beat Margit', current: 0, target: 1 },
  plan: 'Blind run — chat picks my build',
  countdownTo: Date.now() + 3 * 60 * 1000 + 12 * 1000,
  brbText: 'Grabbing a snack — don’t let me die',
  recap: 'Beat Margit on try 14 · picked a strength build',
  nextStream: 'Friday 9pm ET — Stormveil Castle',
  vote: {
    active: true,
    question: 'Which build do I run?',
    a: 'Big sword strength',
    b: 'Glass-cannon mage',
    countA: 58,
    countB: 41,
    reveal: false,
  },
};
