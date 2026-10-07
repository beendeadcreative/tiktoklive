# Setup guide (macOS · Ableton Live 12 · one camera)

## 1. Getting on TikTok LIVE from OBS

OBS sends video to TikTok with a **server URL + stream key**. TikTok decides who
gets one, so check first:

1. You need to be **18+** and, in most regions, have **1,000+ followers** to go LIVE at all.
2. Log in at tiktok.com on your Mac and look for **LIVE Center → Producer**
   (some accounts see it under *TikTok Studio*). If it shows a **Server URL** and
   **Stream Key**, you're set. Paste them into **OBS → Settings → Stream →
   Service: Custom**.
   - Keys are often regenerated for each LIVE session, so check the key every
     time you go live.
3. If you don't see a stream key:
   - **Plan B: TikTok LIVE Studio.** It now has a Mac version in the US, UK and
     some other countries. Run OBS as usual, click **Start Virtual Camera** in
     OBS, and pick *OBS Virtual Camera* as the camera source in LIVE Studio. Pick
     the OBS audio (or your loopback device) as the mic. The template still works;
     LIVE Studio just does the sending.
   - Stream-key access is sometimes unlocked by joining a TikTok **LIVE creator
     network/agency**. Read the terms before signing anything.
   - Avoid third-party "stream key generator" tools. They log in as you through
     unofficial methods and risk your account.

## 2. OBS settings

**Settings → Video**
- Base (canvas) and output resolution: **1080 × 1920** (*Build scenes* sets this for you)
- FPS: **30** (60 only if your Mac and upload speed have headroom)

**Settings → Output → Streaming** (Output mode: Advanced)
- Encoder: **Apple VT H264 Hardware Encoder**
- Rate control: **CBR**, bitrate **4500–6000 Kbps** (keep it at or under ~70% of your upload speed)
- Keyframe interval: **2 s**
- Audio bitrate: **160–192 kbps**

**Settings → Audio**: sample rate **48 kHz**. Set Ableton to 48 kHz too, so
nothing gets resampled and drifts.

## 3. Camera (one-camera setup)

The template uses a single source called **Camera** in every scene. Use
whichever camera you have set up. Since it's the only camera, aim it to show
**you and your hands/keys**. A slightly high angle from the front works well
for talking, writing and playing.

### If it's your phone
- **iPhone:** macOS *Continuity Camera* makes it show up as a normal camera
  (iPhone and Mac signed into the same Apple ID, Wi-Fi and Bluetooth on). Pick
  it in **Camera**. Use a wired USB connection if the picture drops out.
- **Android:** use an app like **Camo** or **DroidCam**, which install a macOS
  camera driver.
- Mount the phone **vertically**. The Talk and Instrument scenes are a full 9:16
  frame, so a landscape camera gets cropped heavily.

### If it's the GoPro HERO9
- The simplest option is **webcam mode** over USB-C with the free **GoPro Webcam**
  desktop app. The HERO9 needs recent firmware. Pick *GoPro Webcam* in
  **Camera**.
- The more reliable option is the **Media Mod's micro-HDMI out** into a cheap USB
  HDMI capture card. It has less lag and no app, and it's the better choice for
  2-hour streams.
- **Heat:** the HERO9 runs hot on long sessions. Take the battery out and run it
  on USB power, and keep the battery door open or buy the vented door.
- Use **Linear** lens mode if it's available, to cut the fisheye bend.

### Adding a second camera later
Add another video source in OBS and drop it into whichever scenes you want. The
control panel and overlays don't care how many cameras you have.

### Ableton screen
**Ableton Screen** is a macOS screen capture. Either capture the whole display
and crop it (⌥-drag an edge) to the arrangement, piano roll or mixer, or add more
copies with different crops. For smooth animated zooms between crops, add the
**Move** transition plugin (see §5).

## 4. Audio (Ableton → OBS)

Keep your **mic** and **Ableton** on separate OBS channels so you can balance and
mute them independently.

### Easiest option (no extra software)
Add a **macOS Audio Capture** source in OBS, set to *Application → Ableton Live*.
It sends only Ableton's audio to the stream. Downside: the **metronome** goes out
on stream too, unless you route it to the Cue output (below).

### Pro option (headphone-only click, a dedicated stream mix)
Use **BlackHole 16ch** (free) or **Loopback** (paid, easier):

1. Audio MIDI Setup → **+ → Create Aggregate Device**: tick your audio
   interface first, then BlackHole. Turn on drift correction for BlackHole.
2. Ableton → Settings → Audio → Output Device: that **Aggregate Device**. Then open
   **Output Config** and enable the BlackHole channel pair.
3. Ableton Master → interface outputs 1/2 (what you hear).
4. Metronome and preview → the **Cue** output, set to your headphone outputs.
   The click never reaches the stream.
5. Create an audio track called **STREAM**: *Audio From: Resampling*, *Monitor:
   In*, *Audio To: Ext. Out → the BlackHole pair*. Put a **Limiter** on it
   (ceiling −1 dB).
6. In OBS, add **Audio Input Capture → BlackHole** for music and **Audio Input
   Capture → your interface's mic input** for your voice.

### OBS audio polish
- Mic filters, in order: **Noise Suppression (RNNoise) → Compressor → Limiter**.
- Add a **Limiter** on the music source too, so a loud playback doesn't clip.
- Mic ducking: add a **Compressor** filter to the music source with *Sidechain
  source = Mic*. The music dips while you talk.
- If the video looks late or early against the audio: **Advanced Audio
  Properties → Sync Offset**. The Ableton buffer size is the usual cause.

> **Copyright:** TikTok will mute or end streams that play copyrighted music.
> Don't play reference tracks, and avoid uncleared samples when soloing loops.

## 5. Recommended plugins and tools

| Tool | Why |
|---|---|
| **Move** (Exeldro) | Smooth animated zooms between Ableton crops and between scenes |
| **Waveform** (phandasm) | Real audio visualizer. Put it in the Playback scene under the Now Playing card (y ≈ 880–1280) |
| **TikFinity** | TikTok follow and gift alerts, like goals, chat commands, and gift → OBS actions ("a Rose picks the drum kit") |
| **Source Clone** (Exeldro) | Reuse one camera with different crops in different scenes |
| **Stream Deck / MIDI controller** | Switch scenes without leaving Ableton (the panel's Program Change option or OBS hotkeys) |

## 6. Pre-stream checklist

- [ ] Stream key copied (keys often change for each session)
- [ ] Ableton at 48 kHz, metronome on Cue only
- [ ] Panel open in Chrome, green dot, MIDI enabled
- [ ] Song, BPM, key and plan filled in; countdown started on *1 · Starting Soon*
- [ ] Safe-zone guide hidden in every scene
- [ ] Camera framed with you and your keys in shot
- [ ] Phone on Do Not Disturb (if it's the camera), or GoPro on USB power with the battery out
- [ ] Record locally too (OBS **Start Recording**) to cut clips afterward
