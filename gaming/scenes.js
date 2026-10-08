// Gaming (PS5) scene layouts for a 1080 × 1920 canvas. Built by the shared
// builder in control/scenes.js.
//
//     0 ─  180   TikTok top bar          (keep text out)
//   200 ─  400   Game card
//   440 ─ 1048   Gameplay, full 16:9 — nothing cropped
//  1060 ─ 1290   Stats: counters + goal bar
//  1300 ─ 1920   Camera (TikTok chat sits over this area)
(function (global) {
  const { overlay, video } = StudioScenes.helpers;
  const ov = overlay('GL');
  const cam = video('Camera');
  const ps5 = video('PS5 (Capture Card)');

  const backdrop = ov('Backdrop', 'overlays/backdrop.html', 0, 0, 1080, 1920);
  const card = ov('Game Card', 'gaming/overlays/game-card.html', 40, 200, 1000, 200);
  const stats = ov('Stats', 'gaming/overlays/stats.html', 40, 1060, 1000, 230);
  const camBottom = cam(0, 1300, 1080, 620);

  // Items are listed bottom → top (first item is furthest back).
  global.GAME_LAYOUT = {
    scenes: [
      { name: '1 · Starting Soon (Game)', items: [ov('Starting Soon', 'gaming/overlays/starting-soon.html', 0, 0, 1080, 1920)] },
      { name: '2 · Just Chatting', items: [backdrop, cam(0, 0, 1080, 1920), card] },
      // Whole game screen, letterboxed so HUD/minimap/subtitles stay visible.
      { name: '3 · Gameplay', items: [backdrop, ps5(0, 440, 1080, 608, { fit: 'contain' }), stats, camBottom, card] },
      // Center of the screen zoomed to fill the frame — great for shooters, action, racing.
      { name: '4 · Gameplay Zoomed', items: [backdrop, ps5(0, 0, 1080, 1300), camBottom, card] },
      { name: '5 · Chat Vote', items: [backdrop, camBottom, card, ov('A/B Vote', 'overlays/vote.html?app=game-live', 40, 440, 1000, 640)] },
      { name: '6 · BRB', items: [ov('BRB', 'gaming/overlays/brb.html', 0, 0, 1080, 1920)] },
      { name: '7 · Ending', items: [ov('Ending', 'gaming/overlays/ending.html', 0, 0, 1080, 1920)] },
    ],
    safeZones: ov('Safe Zones (guide)', 'overlays/safe-zones.html', 0, 0, 1080, 1920),
    doneMessage: 'Done. Double-click "PS5 (Capture Card)" and "Camera" in OBS to pick your devices.',
  };
})(window);
