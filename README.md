# Studio Live — TikTok LIVE template for music sessions

An OBS template for vertical (9:16) TikTok lives where you write, cut demos and
work in Ableton. It gives you:

- **9 scenes**, pre-laid-out for a 1080 × 1920 canvas and kept clear of TikTok's
  on-screen buttons and chat.
- **Branded overlays** (a session card with the song, BPM, key, stage, a REC light,
  a timer and a song-map progress strip; a lyric pad; an A/B vote; on-screen keys
  with chord names; a now-playing card; and starting-soon, BRB and ending screens).
- **A control panel** you keep open next to Ableton to update everything live,
  switch scenes with keys 1–9, and send MIDI notes to the keys overlay.
- **One brand file** (`brand/brand.css`) that re-skins everything.

No installs beyond OBS: the panel and overlays talk to each other through OBS's
built-in WebSocket server.

```
brand/        brand.css (your colors + fonts), logo.png (optional, add your own)
overlays/     browser-source pages + config.js (OBS WebSocket settings)
control/      panel.html — the control panel
docs/         SETUP.md — full Mac setup guide (stream key, cameras, audio)
```

## Quick start

1. **OBS → Tools → WebSocket Server Settings** → tick *Enable WebSocket server*.
   Either untick *Enable Authentication* (fine, since it only listens on your Mac)
   or copy the password into `overlays/config.js`.
2. Open `control/panel.html` in **Chrome** (drag the file into a Chrome window).
   The dot next to the title should turn green.
3. In the panel, open **OBS connection → Build scenes in OBS**. This sets the
   canvas to 1080 × 1920 and creates scenes `1 · Starting Soon` … `9 · Ending`
   with all overlays placed.
4. In OBS, double-click **Face Cam (Phone)**, **Overhead Cam (GoPro)** and
   **Ableton Screen** and pick the right device or display. Then crop the
   Ableton capture to the part of the screen you want (hold ⌥ Option and drag
   an edge).
5. Add your audio sources (see [docs/SETUP.md](docs/SETUP.md#audio-ableton--obs)).

Re-running *Build scenes* is safe. It only adds what's missing and never moves
anything you've rearranged.

## The scenes

| Key | Scene | Use it for |
|---|---|---|
| 1 | Starting Soon | Countdown, tonight's plan, the song on the bench |
| 2 | Talk | Full-screen face cam + session card |
| 3 | Writing | Face cam on top, live lyric pad below |
| 4 | DAW Focus | Ableton in the middle, face cam at the bottom |
| 5 | Instrument | GoPro overhead + on-screen keys/chords, face cam at the bottom |
| 6 | Playback | Big "now playing" card for first listens (add a visualizer below it) |
| 7 | Vote | A/B vote: snares, hooks, mixes, titles |
| 8 | BRB | Break screen with a custom message |
| 9 | Ending | Recap of the session + next stream time |

Every scene also has a hidden, locked **SL · Safe Zones (guide)** source. Toggle
its eye icon while arranging to see where TikTok's UI will cover the video.

```
   0 ─  180   TikTok top bar          (keep text out)
 200 ─  420   Session card
 450 ─ 1300   Main content: DAW / overhead cam / lyrics / vote
1300 ─ 1920   Chat area — fine for a face cam, not for text
```

## Re-skinning with your brand

Edit `brand/brand.css`: swap the hex values, set your fonts (any Google Font
works) and drop a `logo.png` into `brand/`. In OBS, right-click a browser source
→ *Refresh* (or restart OBS) to see the change everywhere.

## Previewing overlays without OBS

Open any overlay with `#demo` on the end of the URL, e.g.
`overlays/session-card.html#demo`, to see it with sample data on a checkerboard.

## Running a session

- **Session card**: type the song, version, BPM and key, and pick the stage.
  **● REC** lights the red recording badge. **Start timer** starts the session
  clock.
- **Song map**: click sections to mark them active or done, or hit
  **Next section →** as you move through the song.
- **Lyric pad**: whatever you type appears live on the Writing scene, and the
  last line is highlighted.
- **A/B vote**: fill in the question and options, then **Show vote**. Count A or B
  from chat with the + buttons, then **Reveal winner**.
- **MIDI**: click **Enable MIDI**, then play. Held notes and the chord name
  appear on the Instrument scene. The sustain pedal is respected. Tick the
  Program Change box to switch scenes from a foot switch or controller.
- **Keys 1–9** switch scenes whenever you're not typing in a field.

You can also dock the panel inside OBS (**Docks → Custom Browser Docks**, then
paste the `file:///…/control/panel.html` path). MIDI only works in Chrome or Edge,
though, so keep a Chrome window open if you want the keys overlay.

See **[docs/SETUP.md](docs/SETUP.md)** for the stream key, cameras, Ableton audio
routing, OBS output settings and a pre-stream checklist.
