// Production breakdown layouts — vertical 1080 × 1920 and landscape
// 1920 × 1080 — for your whole computer screen + one camera. Built by the
// shared builder in control/scenes.js.
// Reuses the music overlays (session card, now playing, full-screen scenes)
// with ?app=breakdown-live so they listen to the breakdown panel.
//
// Vertical:
//     0 ─  180   TikTok top bar          (keep text out)
//   200 ─  420   Breakdown card (song, BPM/key, chapters)
//   440 ─ 1048   Full computer screen, 16:9 — nothing cropped
//  1060 ─ 1290   Spotlight: what you're breaking down right now
//  1300 ─ 1920   Camera (TikTok chat sits over this area)
(function (global) {
  const { overlay, video, screen } = StudioScenes.helpers;
  const ov = overlay('BD');
  const cam = video('Camera');
  const desk = screen('Computer Screen');
  const APP = '?app=breakdown-live';

  const backdrop = ov('Backdrop', 'overlays/backdrop.html', 0, 0, 1080, 1920);
  const card = ov('Breakdown Card', 'overlays/session-card.html' + APP, 40, 200, 1000, 220);
  const spotlight = ov('Spotlight', 'breakdown/overlays/spotlight.html', 40, 1060, 1000, 230);
  const question = ov('Chat Question', 'breakdown/overlays/question.html', 40, 1060, 1000, 230);
  const camBottom = cam(0, 1300, 1080, 620);

  // Items are listed bottom → top (first item is furthest back).
  global.BREAKDOWN_LAYOUT = {
    scenes: [
      { name: '1 · Starting Soon (Breakdown)', items: [ov('Starting Soon', 'overlays/starting-soon.html' + APP, 0, 0, 1080, 1920)] },
      { name: '2 · Intro', items: [backdrop, cam(0, 0, 1080, 1920), card] },
      // The entire screen, letterboxed so every track, plugin and meter is visible.
      { name: '3 · Full Screen', items: [backdrop, desk(0, 440, 1080, 608, { fit: 'contain' }), spotlight, camBottom, card] },
      // Zoomed into part of the screen — crop it to the device chain, piano roll, mixer…
      { name: '4 · Screen Zoom', items: [backdrop, desk(0, 0, 1080, 1050), spotlight, camBottom] },
      { name: '5 · Q&A', items: [backdrop, cam(0, 0, 1080, 1920), card, question] },
      { name: '6 · Full Listen', items: [backdrop, camBottom, ov('Now Playing', 'overlays/now-playing.html' + APP, 40, 300, 1000, 560)] },
      { name: '7 · BRB', items: [ov('BRB', 'overlays/brb.html' + APP, 0, 0, 1080, 1920)] },
      { name: '8 · Ending', items: [ov('Ending', 'overlays/ending.html' + APP, 0, 0, 1080, 1920)] },
    ],
    safeZones: ov('Safe Zones (guide)', 'overlays/safe-zones.html', 0, 0, 1080, 1920),
    doneMessage: 'Done. Double-click "Computer Screen" and "Camera" in OBS to pick your display and camera.',
  };

  // ── Landscape 16:9 (1920 × 1080) ─────────────────────────────
  //   ┌──────────────────────────────┬────────┐
  //   │                              │ Camera │  30 ─ 550
  //   │   Computer screen (16:9)     ├────────┤
  //   │   1400 × 788                 │ Song + │ 568 ─ 1050
  //   ├──────────────────────────────┤ chap-  │
  //   │   Spotlight bar              │ ters   │
  //   └──────────────────────────────┴────────┘
  const L = { x: 30, y: 30, w: 1400, h: 788 }; // screen area
  const side = { x: 1460, w: 430 };
  const wideBackdrop = ov('Backdrop', 'overlays/backdrop.html', 0, 0, 1920, 1080);
  const sidebar = ov('Sidebar', 'breakdown/overlays/sidebar.html', side.x, 568, side.w, 482);
  const wideSpotlight = ov('Spotlight', 'breakdown/overlays/spotlight.html', L.x, 838, L.w, 212);
  const wideQuestion = ov('Chat Question', 'breakdown/overlays/question.html', L.x, 838, L.w, 212);
  const camSide = cam(side.x, 30, side.w, 520);
  const camFull = cam(0, 0, 1920, 1080);

  global.BREAKDOWN_LANDSCAPE = {
    canvas: { w: 1920, h: 1080 },
    scenes: [
      { name: '1 · Starting Soon (Breakdown)', items: [ov('Starting Soon', 'overlays/starting-soon.html' + APP, 0, 0, 1920, 1080)] },
      { name: '2 · Intro', items: [wideBackdrop, camFull, sidebar] },
      // The entire screen, uncropped, as big as possible.
      { name: '3 · Full Screen', items: [wideBackdrop, desk(L.x, L.y, L.w, L.h, { fit: 'contain' }), wideSpotlight, camSide, sidebar] },
      // Part of the screen filling the frame, with the camera as a small corner box.
      { name: '4 · Screen Zoom', items: [wideBackdrop, desk(0, 0, 1920, 1080), wideSpotlight, cam(1490, 30, 400, 300)] },
      { name: '5 · Q&A', items: [wideBackdrop, camFull, sidebar, wideQuestion] },
      { name: '6 · Full Listen', items: [wideBackdrop, cam(1240, 30, 650, 1020), ov('Now Playing', 'overlays/now-playing.html' + APP, 180, 260, 1000, 560)] },
      { name: '7 · BRB', items: [ov('BRB', 'overlays/brb.html' + APP, 0, 0, 1920, 1080)] },
      { name: '8 · Ending', items: [ov('Ending', 'overlays/ending.html' + APP, 0, 0, 1920, 1080)] },
    ],
    safeZones: null,
    doneMessage: 'Done. Double-click "Computer Screen" and "Camera" in OBS to pick your display and camera.',
  };
})(window);
