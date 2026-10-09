// Scene builder shared by every template, plus the music template's layout.
// Creates scenes in OBS through obs-websocket for a 1080 × 1920 (9:16) canvas.
// Re-running the builder is safe: anything that already exists is left alone,
// so your manual tweaks survive.
//
// Vertical map (TikTok covers the top ~180px, the right edge of the lower
// half, and the bottom ~620px with its own UI):
//
//     0 ─ 180   TikTok top bar          (keep text out)
//   200 ─ 420   Session card
//   450 ─ 1300  Main content: DAW / lyrics / vote
//  1300 ─ 1920  Chat area — fine for camera, not for text
//
// Music layout: every scene uses the same "Camera" source (phone or GoPro).
(function (global) {
  // ── Helpers for describing a layout ────────────────────────
  // Overlay files are relative to the repo root, e.g. 'overlays/vote.html'.
  // `fit: 'contain'` letterboxes a video source instead of cropping it.
  const overlay = (prefix) => (name, file, x, y, w, h) => ({ type: 'browser', name: `${prefix} · ${name}`, file, x, y, w, h });
  const video = (name) => (x, y, w, h, opts = {}) => ({ type: 'video', name, x, y, w, h, ...opts });
  const screen = (name) => (x, y, w, h, opts = {}) => ({ type: 'screen', name, x, y, w, h, ...opts });

  // ── Music template (control/panel.html) ────────────────────
  const ov = overlay('SL');
  const cam = video('Camera');
  const daw = screen('Ableton Screen');

  const backdrop = ov('Backdrop', 'overlays/backdrop.html', 0, 0, 1080, 1920);
  const card = ov('Session Card', 'overlays/session-card.html', 40, 200, 1000, 220);
  const camFull = cam(0, 0, 1080, 1920);
  const camBottom = cam(0, 1300, 1080, 620);

  // Items are listed bottom → top (first item is furthest back).
  const MUSIC = {
    scenes: [
      { name: '1 · Starting Soon', items: [ov('Starting Soon', 'overlays/starting-soon.html', 0, 0, 1080, 1920)] },
      { name: '2 · Talk', items: [backdrop, camFull, card] },
      { name: '3 · Writing', items: [backdrop, cam(0, 0, 1080, 820), ov('Lyric Pad', 'overlays/lyric-pad.html', 40, 830, 1000, 470)] },
      { name: '4 · DAW Focus', items: [backdrop, daw(0, 450, 1080, 850), camBottom, card] },
      { name: '5 · Instrument', items: [backdrop, camFull, card, ov('Keys', 'overlays/keys.html', 40, 1105, 1000, 190)] },
      { name: '6 · Playback', items: [backdrop, camBottom, ov('Now Playing', 'overlays/now-playing.html', 40, 300, 1000, 560)] },
      { name: '7 · Vote', items: [backdrop, camBottom, card, ov('A/B Vote', 'overlays/vote.html', 40, 450, 1000, 640)] },
      { name: '8 · BRB', items: [ov('BRB', 'overlays/brb.html', 0, 0, 1080, 1920)] },
      { name: '9 · Ending', items: [ov('Ending', 'overlays/ending.html', 0, 0, 1080, 1920)] },
    ],
    safeZones: ov('Safe Zones (guide)', 'overlays/safe-zones.html', 0, 0, 1080, 1920),
    doneMessage: 'Done. Pick your devices: double-click "Camera" and "Ableton Screen" in OBS.',
  };

  // ── Builder ─────────────────────────────────────────────────
  // Input kinds differ between OBS versions/platforms; use the first one available.
  // Capture cards show up as video devices, so they use the camera kinds too.
  const VIDEO_KINDS = ['macos-avcapture', 'av_capture_input_v2', 'av_capture_input', 'dshow_input', 'v4l2_input'];
  const SCREEN_KINDS = ['screen_capture', 'display_capture', 'monitor_capture', 'xshm_input'];

  const OBS_ALIGN_TOP_LEFT = 5;

  async function buildScenes(bus, rootUrl, log, layout) {
    const { inputKinds } = await bus.request('GetInputKindList', { unversioned: false });
    const videoKind = VIDEO_KINDS.find((k) => inputKinds.includes(k));
    const screenKind = SCREEN_KINDS.find((k) => inputKinds.includes(k));
    if (!videoKind) log('⚠ No video capture input type found — add cameras / capture cards by hand.');
    if (!screenKind && layout.scenes.some((s) => s.items.some((i) => i.type === 'screen'))) {
      log('⚠ No screen capture input type found — add screen capture by hand.');
    }

    try {
      await bus.request('SetVideoSettings', {
        baseWidth: 1080, baseHeight: 1920, outputWidth: 1080, outputHeight: 1920,
      });
      log('✓ Canvas set to 1080 × 1920');
    } catch (err) {
      log('⚠ Could not set canvas (stop streaming/recording first): ' + err.message);
    }

    for (const scene of layout.scenes) {
      try {
        await bus.request('CreateScene', { sceneName: scene.name });
        log('✓ Scene ' + scene.name);
      } catch (err) {
        if (err.code !== 601) throw err; // 601 = already exists
        log('· Scene ' + scene.name + ' exists');
      }
      for (const item of [...scene.items, layout.safeZones]) {
        await addItem(bus, scene.name, item, { videoKind, screenKind, rootUrl, log, guide: item === layout.safeZones });
      }
    }
    log(layout.doneMessage);
  }

  async function addItem(bus, sceneName, item, ctx) {
    try {
      await bus.request('GetSceneItemId', { sceneName, sourceName: item.name });
      return; // already in this scene — leave it as the user arranged it
    } catch (err) {
      if (err.code !== 600) throw err; // 600 = not found
    }

    let inputKind, inputSettings;
    if (item.type === 'browser') {
      inputKind = 'browser_source';
      inputSettings = {
        is_local_file: false,
        url: new URL(item.file, ctx.rootUrl).href,
        width: item.w,
        height: item.h,
        css: '',
        shutdown: false,
      };
    } else {
      inputKind = item.type === 'video' ? ctx.videoKind : ctx.screenKind;
      inputSettings = {};
      if (!inputKind) return;
    }

    let sceneItemId;
    try {
      ({ sceneItemId } = await bus.request('CreateInput', { sceneName, inputName: item.name, inputKind, inputSettings }));
    } catch (err) {
      if (err.code !== 601) throw err;
      ({ sceneItemId } = await bus.request('CreateSceneItem', { sceneName, sourceName: item.name }));
    }

    const transform = { positionX: item.x, positionY: item.y, alignment: OBS_ALIGN_TOP_LEFT };
    if (item.type !== 'browser') {
      // Video/screens: fill the box (cover) and crop whatever spills over,
      // or fit inside it without cropping when the layout asks for 'contain'.
      Object.assign(transform, {
        boundsType: item.fit === 'contain' ? 'OBS_BOUNDS_SCALE_INNER' : 'OBS_BOUNDS_SCALE_OUTER',
        boundsWidth: item.w,
        boundsHeight: item.h,
        boundsAlignment: 0,
        cropToBounds: true,
      });
    }
    await bus.request('SetSceneItemTransform', { sceneName, sceneItemId, sceneItemTransform: transform });

    if (ctx.guide) {
      await bus.request('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: false });
      await bus.request('SetSceneItemLocked', { sceneName, sceneItemId, sceneItemLocked: true });
    }
    ctx.log(`  + ${item.name} → ${sceneName}`);
  }

  global.StudioScenes = { MUSIC, buildScenes, helpers: { overlay, video, screen } };
})(window);
