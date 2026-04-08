

## Fix Audio Seeking in Both Players

### Problem
Two issues:

1. **PodcastPlayer**: `onValueChange` fires continuously during drag, but the 200ms progress interval overwrites `progress` state from `audio.currentTime`, causing a tug-of-war. The slider snaps back. Also, the `onended` event may not fire correctly if `currentTime` exceeds `duration` due to floating-point issues, causing playback to "continue beyond the end" (3:32 / 3:26 as shown).

2. **AudioPlayer**: Slider has `disabled` hardcoded — seeking is impossible.

### Fix

**File: `src/components/learnpath/LearnPathPodcastPlayer.tsx`**
- Add a `seekingRef = useRef(false)`
- Change Slider from `onValueChange={handleSeek}` to:
  - `onValueChange` — set `seekingRef.current = true` and update visual progress only (no audio seek)
  - `onValueCommit` — perform actual `audio.currentTime` seek, then set `seekingRef.current = false`
- In `startProgressTracking` interval, skip updates when `seekingRef.current === true`
- In `onended` handler and the interval, clamp `currentTime` to not exceed `duration` to prevent the "beyond end" display bug

**File: `src/components/learnpath/LearnPathAudioPlayer.tsx`**
- Remove `disabled` from the Slider
- Add a `seekingRef` with the same `onValueChange`/`onValueCommit` pattern
- In the progress interval, skip updates when seeking
- Only allow interaction when status is `playing` or `paused`

### Scope
Two files, no new dependencies.

