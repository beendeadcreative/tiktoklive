# Breakdown Live — production breakdown template

An OBS template for walking viewers through how a song was made, with your
**whole computer screen** and **one camera**. It comes in two layouts:

- **Landscape 16:9 (1920 × 1080)**, the default. Built for a computer
  screen: your screen big on the left, the camera and song/chapters card on the
  right, and the spotlight bar underneath. Best when viewers watch on desktop or
  turn their phone sideways, and when you're streaming to YouTube/Twitch too.
- **Vertical 9:16 (1080 × 1920)**. Built for phones scrolling TikTok.

```
┌──────────────────────────────┬────────┐
│                              │ Camera │
│   Your computer screen       ├────────┤
│                              │ Song + │
├──────────────────────────────┤ chap-  │
│   Now breaking down…         │ ters   │
└──────────────────────────────┴────────┘
```

It comes pre-loaded for **Superpowers**, and works for any song: just change
the name in the panel.

```
breakdown/panel.html      control panel (open in Chrome)
breakdown/overlays/       spotlight (now breaking down + Before/After), chat question, sidebar
breakdown/scenes.js       scene layouts
```

It reuses the music template's session card, now-playing card and full-screen
scenes, so it all looks the same.

## Set up OBS

1. **Scene Collection → New** and name it "Breakdown". Keeping it separate
   stops its scenes and hotkeys mixing with the music and gaming ones.
2. Open `breakdown/panel.html` in **Chrome** and wait for the green dot.
3. **OBS connection** → choose **Landscape 16:9** or **Vertical 9:16** in the
   dropdown → **Build scenes in OBS**. This also sets OBS's canvas to that size.
   Want both? Build each into its own scene collection.
4. In OBS, double-click **Computer Screen** and pick your display. Then
   double-click **Camera** and pick your phone or GoPro.
   - macOS asks for **Screen Recording** permission for OBS the first time
     (System Settings → Privacy & Security → Screen & System Audio Recording).
5. **Audio:** your song playback needs to reach the stream. Use the
   *macOS Audio Capture → Ableton Live* source, or the BlackHole/Loopback setup
   in [../docs/SETUP.md](../docs/SETUP.md#4-audio-ableton--obs). Add your mic too.

## Scenes

| Key | Scene | Layout |
|---|---|---|
| 1 | Starting Soon (Breakdown) | Countdown, tonight's plan, the song |
| 2 | Intro | Camera full-screen + song/chapters card |
| 3 | Full Screen | Your **entire** screen (nothing cropped) + spotlight + camera |
| 4 | Screen Zoom | Part of your screen filling the frame + spotlight + camera (a small corner box in landscape) |
| 5 | Q&A | Camera full-screen + a pinned chat question |
| 6 | Full Listen | Big "now playing" card + camera while you play the whole song |
| 7 | BRB | Break screen |
| 8 | Ending | Recap + next stream |

**Making Screen Zoom useful.** Zoom in on whatever you're explaining. It
matters most in vertical, where the full screen is tiny on a phone. Select
**Computer Screen** in the Screen Zoom scene, then hold **⌥ Option** and drag its edges to crop to the device chain,
piano roll, a plugin window or the mixer. Want several zooms (e.g. "Zoom ·
Devices" and "Zoom · Mixer")? Duplicate the scene (right-click → Duplicate)
and crop each copy differently.

> Tip: set your Mac display to a lower "looks like" resolution (or zoom
> Ableton's interface to 125–150% in Settings → Display & Input) during
> breakdowns. Bigger UI reads much better on phones.

## The control panel

- **Song:** name, BPM, key, the label on the card ("Production breakdown")
  and a session timer.
- **Chapters:** the parts you'll walk through (Intro, Drums, Bass, Chords &
  synths, Vocals, FX & transitions, Mix & master). Edit them to match the song.
  Click a chapter to make it active, or press **N** for the next one. The card
  shows your progress, and the spotlight shows "3 of 7".
- **Spotlight:** what you're showing right now, plus a detail line for plugins,
  chain or the trick. Leave the element blank and it uses the current chapter
  name.
- **Before / After badge:** press **B** to flip it while you toggle a plugin or
  solo the raw vs. processed sound. It's the most satisfying part of a
  breakdown for viewers.
- **Chat question:** paste a question with the viewer's @, then **Show
  question**. It appears on the Q&A scene.
- **Keys 1–8** switch scenes when you're not typing.

## Ideas for the Superpowers breakdown

- Open with 20–30 seconds of the finished hook on **Full Listen**, then go to
  **Intro** and say "here's how it's built".
- For each chapter: solo the element, flip **Before/After** on the main
  processing, then un-solo so people hear it in context.
- Save the mix bus / master chain for last, with a full Before/After of the
  whole song.
- End with a full play-through on **Full Listen**, then **Ending** with what's
  next (remix? stems? the next song?).

## Landscape on TikTok

You stream a landscape layout to TikTok the same way, with the same server URL
and stream key. OBS's canvas is set to 1920 × 1080 by the Build button. Phone
viewers see it letterboxed (a band across the middle) unless they rotate or go
full-screen, so use **Screen Zoom** generously and keep text big.

TikTok's on-screen buttons and chat are placed differently for landscape lives,
and this layout has no safe-zone guide for them. Do a short private test stream
first and check that nothing important ends up under the chat. If it does,
nudge the spotlight bar or sidebar in OBS.
