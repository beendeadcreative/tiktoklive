# Game Live — TikTok LIVE template for PS5 gaming

A vertical (1080 × 1920) OBS template for streaming PS5 games to TikTok,
in the same Been Dead Creative look as the music template. It uses the same
`brand/`, the same OBS connection and the same "Build scenes" button.

```
gaming/panel.html     control panel (open in Chrome)
gaming/overlays/      game card, stats/goal tracker, starting soon, BRB, ending
gaming/scenes.js      scene layouts
```

## What you need

- **PS5 → capture card → Mac.** The PS5's HDMI goes into a capture card
  (for example Elgato HD60 X, or any cheap USB-C/USB 3 HDMI capture dongle).
  The card connects to the Mac by USB, and its HDMI out goes to your TV or
  monitor so you play with no lag.
- **One camera** (phone or GoPro, same as the music setup), optional but
  recommended.
- OBS with the WebSocket server on (**Tools → WebSocket Server Settings**).

## PS5 settings (important)

1. **Turn off HDCP**, or the capture card shows a black screen:
   **Settings → System → HDMI → Enable HDCP → off.**
2. **Video output:** if your card doesn't pass 4K through, set the resolution
   to 1080p (**Settings → Screen and Video → Video Output → Resolution**).
   Also turn HDR off for capture, since HDR footage looks washed out in OBS
   unless the card handles it.
3. **Audio:** game audio travels over HDMI into the capture card. If you
   use a headset on the controller, set **Settings → Sound → Audio Output →
   Output to Headphones → Chat Audio**. Game sound then stays on HDMI (and on
   stream) while party chat stays in your ears.
   > Want party chat on stream too? Choose *All Audio* instead and capture the
   > headset differently. That's more advanced, so ask if you want it.
4. Some games have a **streamer mode** or **licensed-music toggle**. Turn it on,
   or TikTok may mute your stream for copyrighted soundtrack songs.

## Set up OBS

1. **Scene Collection → New** and name it something like "Been Dead Gaming".
   Keeping gaming in its own collection keeps it separate from the music
   scenes and their 1–9 hotkeys.
2. Open `gaming/panel.html` in **Chrome** and wait for the green dot.
3. **OBS connection → Build scenes in OBS.**
4. In OBS, double-click **PS5 (Capture Card)** and pick your capture card.
   Then double-click **Camera** and pick your camera.
5. **Audio:** add **Audio Input Capture** for the capture card (game sound)
   and for your mic. Turn off **Monitor** on the game audio so you don't hear
   it twice.
6. If the gameplay looks slightly out of sync with the audio, use **Advanced
   Audio Properties → Sync Offset** on the game audio. Start around 50–150 ms.

## Scenes

| Key | Scene | Layout |
|---|---|---|
| 1 | Starting Soon (Game) | Countdown, tonight's plan, the game |
| 2 | Just Chatting | Camera full-screen + game card |
| 3 | Gameplay | Whole game screen (nothing cropped) + counters/goal + camera below |
| 4 | Gameplay Zoomed | Center of the screen filling the frame + camera below. Great for shooters, action and racing |
| 5 | Chat Vote | Chat picks: builds, routes, loadouts, next game |
| 6 | BRB | Break screen |
| 7 | Ending | "GG" recap with tonight's counter totals + next stream |

Use **Gameplay** when the HUD, map or subtitles matter, and **Gameplay
Zoomed** when the action is in the middle of the screen. If the zoomed crop
cuts something you need, select the PS5 source in that scene and hold ⌥ Option
while dragging an edge to adjust it.

## The control panel

- **Session:** game, platform, a status line ("Ranked grind", "Chapter 3",
  "Blind run") and a session timer.
- **Counters:** three named counters (Deaths, Wins, Kills, Rage quits…).
  While the panel window is focused, press **Q / W / E** to add one, or
  **Shift + Q / W / E** to subtract. Leave a name blank to hide that counter.
- **Goal:** a progress bar like "Beat Margit 0/1", "10 wins tonight" or
  "1,000 likes". It turns rust-red when complete.
- **Chat vote, countdown, BRB message, recap, next stream:** same as the music
  panel.
- **Keys 1–7** switch scenes when you're not typing in a field.

> Tip: your hands are on the controller, so a Stream Deck (or a cheap
> programmable keypad) set to Q/W/E and 1–7 lets you update counters and switch
> scenes without touching the Mac.

## Previewing

Open any overlay with `#demo` on the end of its URL to see sample data,
e.g. `gaming/overlays/stats.html#demo`.
