# Studio Live — TikTok LIVE templates (Been Dead Creative)

This repo holds three OBS templates that share one brand and one engine:

| Template | Open this panel | Guide |
|---|---|---|
| 🎹 **Music**: writing and cutting demos in Ableton | `control/panel.html` | this page + [docs/SETUP.md](docs/SETUP.md) |
| 🎮 **Gaming**: PS5 via capture card | `gaming/panel.html` | [gaming/README.md](gaming/README.md) |
| 🎛 **Breakdown**: production breakdown of a finished song (full screen + camera) | `breakdown/panel.html` | [breakdown/README.md](breakdown/README.md) |

Use a separate OBS **Scene Collection** for each (Scene Collection → New) so
their scenes and 1–9 hotkeys don't mix. The stream key, audio and camera setup
in [docs/SETUP.md](docs/SETUP.md) apply to both.

---

## Music template

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
brand/        brand.css (colors + fonts), logos, bundled fonts
overlays/     music overlays, shared libs + config.js (OBS WebSocket settings)
control/      panel.html — music control panel; shared panel + scene engine
gaming/       PS5 gaming template (panel, overlays, guide)
breakdown/    production breakdown template (panel, overlays, guide)
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
4. In OBS, double-click **Camera** and **Ableton Screen** and pick your camera
   (phone or GoPro) and display. Then crop the
   Ableton capture to the part of the screen you want (hold ⌥ Option and drag
   an edge).
5. Add your audio sources (see [docs/SETUP.md](docs/SETUP.md#audio-ableton--obs)).

Re-running *Build scenes* is safe. It only adds what's missing and never moves
anything you've rearranged.

> **Already built the old two-camera version?** In OBS, choose **Scene Collection
> → New**, give it a name, then click *Build scenes* again. You get the
> one-camera layout without leftover sources.

## The scenes

| Key | Scene | Use it for |
|---|---|---|
| 1 | Starting Soon | Countdown, tonight's plan, the song on the bench |
| 2 | Talk | Full-screen camera + session card |
| 3 | Writing | Camera on top, live lyric pad below |
| 4 | DAW Focus | Ableton in the middle, camera at the bottom |
| 5 | Instrument | Full-screen camera + on-screen keys/chords from your MIDI keyboard |
| 6 | Playback | Big "now playing" card for first listens, camera at the bottom |
| 7 | Vote | A/B vote (snares, hooks, mixes, titles), camera at the bottom |
| 8 | BRB | Break screen with a custom message |
| 9 | Ending | Recap of the session + next stream time |

Every scene also has a hidden, locked **SL · Safe Zones (guide)** source. Toggle
its eye icon while arranging to see where TikTok's UI will cover the video.

```
   0 ─  180   TikTok top bar          (keep text out)
 200 ─  420   Session card
 450 ─ 1300   Main content: DAW / lyrics / vote
1300 ─ 1920   Chat area — fine for the camera, not for text
```

## Branding (Been Dead Creative)

Everything is styled from `brand/brand.css`, using colors taken from the logo:
**sand `#D0BF93`** and **blue `#2E6792`**, with deep blue `#1F4A6E` for body
text and a rust `#B5402A` for the REC light and winner badges.

- **Fonts** (bundled in `brand/fonts`, open-licensed, no internet needed):
  *Fraunces Black Italic* for titles (echoes CREATIVE), *Oswald* for labels and
  numbers (echoes BEEN DEAD), and *Inter* for body text.
- **Logo:** `brand/logo.png` (blue) and `brand/logo-light.png` (cream, for
  dark or blue backgrounds). Both have transparent backgrounds.
- **Style:** full-screen scenes are sand "paper" with grain and a thin blue
  print frame. Overlays are cream paper cards.

To tweak it, edit the hex values or fonts in `brand/brand.css`. Then in OBS,
right-click a browser source → *Refresh* (or restart OBS).

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
