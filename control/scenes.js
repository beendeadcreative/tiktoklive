// Scene layouts for a 1080 × 1920 (9:16) canvas, and a builder that creates
// them in OBS through obs-websocket. Re-running the builder is safe: anything
// that already exists is left alone, so your manual tweaks survive.
//
// Vertical map (TikTok covers the top ~180px, the right edge of the lower
// half, and the bottom ~620px with its own UI):
//
//     0 ─ 180   TikTok top bar          (keep text out)
//   200 ─ 420   Session card
//   450 ─ 1300  Main content: DAW / overhead cam / lyrics / vote
//  1300 ─ 1920  Chat area — fine for a face cam, not for text
(function (global) {
  const FACE = 'Face Cam (Phone)';
  const OVERHEAD = 'Overhead Cam (GoPro)';
  const SCREEN = 'Ableton Screen';

  const ov = (name, file, x, y, w, h) => ({ type: 'browser', name: 'SL · ' + name, file, x, y, w, h });
  const cam = (name, x, y, w, h) => ({ type: 'camera', name, x, y, w, h });
  const screen = (x, y, w, h) => ({ type: 'screen', name: SCREEN, x, y, w, h });

  const backdrop = ov('Backdrop', 'backdrop.html', 0, 0, 1080, 1920);
  const card = ov('Session Card', 'session-card.html', 40, 200, 1000, 220);
  const faceBottom = cam(FACE, 0, 1300, 1080, 620);

  // Items are listed bottom → top (first item is furthest back).
  const SCENES = [
    { name: '1 · Starting Soon', items: [ov('Starting Soon', 'starting-soon.html', 0, 0, 1080, 1920)] },
    { name: '2 · Talk', items: [backdrop, cam(FACE, 0, 0, 1080, 1920), card] },
    { name: '3 · Writing', items: [backdrop, cam(FACE, 0, 0, 1080, 820), ov('Lyric Pad', 'lyric-pad.html', 40, 830, 1000, 470)] },
    { name: '4 · DAW Focus', items: [backdrop, screen(0, 450, 1080, 850), faceBottom, card] },
    { name: '5 · Instrument', items: [backdrop, cam(OVERHEAD, 0, 450, 1080, 650), faceBottom, card, ov('Keys', 'keys.html', 40, 1105, 1000, 190)] },
    { name: '6 · Playback', items: [backdrop, faceBottom, ov('Now Playing', 'now-playing.html', 40, 300, 1000, 560)] },
    { name: '7 · Vote', items: [backdrop, faceBottom, card, ov('A/B Vote', 'vote.html', 40, 450, 1000, 640)] },
    { name: '8 · BRB', items: [ov('BRB', 'brb.html', 0, 0, 1080, 1920)] },
    { name: '9 · Ending', items: [ov('Ending', 'ending.html', 0, 0, 1080, 1920)] },
  ];
  const SAFE_ZONES = ov('Safe Zones (guide)', 'safe-zones.html', 0, 0, 1080, 1920);

  // Input kinds differ between OBS versions/platforms; use the first one available.
  const CAMERA_KINDS = ['macos-avcapture', 'av_capture_input_v2', 'av_capture_input', 'dshow_input', 'v4l2_input'];
  const SCREEN_KINDS = ['screen_capture', 'display_capture', 'monitor_capture', 'xshm_input'];

  const OBS_ALIGN_TOP_LEFT = 5;

  async function buildScenes(bus, overlaysBaseUrl, log) {
    const { inputKinds } = await bus.request('GetInputKindList', { unversioned: false });
    const cameraKind = CAMERA_KINDS.find((k) => inputKinds.includes(k));
    const screenKind = SCREEN_KINDS.find((k) => inputKinds.includes(k));
    if (!cameraKind) log('⚠ No camera input type found — add cameras by hand.');
    if (!screenKind) log('⚠ No screen capture input type found — add Ableton capture by hand.');

    try {
      await bus.request('SetVideoSettings', {
        baseWidth: 1080, baseHeight: 1920, outputWidth: 1080, outputHeight: 1920,
      });
      log('✓ Canvas set to 1080 × 1920');
    } catch (err) {
      log('⚠ Could not set canvas (stop streaming/recording first): ' + err.message);
    }

    for (const scene of SCENES) {
      try {
        await bus.request('CreateScene', { sceneName: scene.name });
        log('✓ Scene ' + scene.name);
      } catch (err) {
        if (err.code !== 601) throw err; // 601 = already exists
        log('· Scene ' + scene.name + ' exists');
      }
      for (const item of [...scene.items, SAFE_ZONES]) {
        await addItem(bus, scene.name, item, { cameraKind, screenKind, overlaysBaseUrl, log });
      }
    }
    log('Done. Pick your devices: double-click each camera / screen source in OBS.');
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
        url: new URL(item.file, ctx.overlaysBaseUrl).href,
        width: item.w,
        height: item.h,
        css: '',
        shutdown: false,
      };
    } else {
      inputKind = item.type === 'camera' ? ctx.cameraKind : ctx.screenKind;
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
      // Cameras/screens: fill the box (cover) and crop whatever spills over.
      Object.assign(transform, {
        boundsType: 'OBS_BOUNDS_SCALE_OUTER',
        boundsWidth: item.w,
        boundsHeight: item.h,
        boundsAlignment: 0,
        cropToBounds: true,
      });
    }
    await bus.request('SetSceneItemTransform', { sceneName, sceneItemId, sceneItemTransform: transform });

    if (item === SAFE_ZONES) {
      await bus.request('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: false });
      await bus.request('SetSceneItemLocked', { sceneName, sceneItemId, sceneItemLocked: true });
    }
    ctx.log(`  + ${item.name} → ${sceneName}`);
  }

  global.StudioScenes = { SCENES, buildScenes };
})(window);
