# Speechy

**Speechy is a personal, browser-based augmentative and alternative communication (AAC) phraseboard.** It emphasizes complete, natural-sounding adult language and fast participation in everyday conversations, meetings, appointments, and community life. Its visual design takes inspiration from Windows XP.

**Open the live board:** https://lancepounds.github.io/Speechy/

Speechy is a personal prototype, not a standardized AAC assessment or a clinically validated replacement for a person's prescribed communication system.

## Settings panel

Choose **Settings** beside the Speechy name at the top. The section shortcuts jump directly to each group:

- **Speech:** Tap speaks / Tap builds, device voice, speaking speed, and Test voice / Stop voice. Testing
  a voice leaves the current communication message in place.
- **Appearance & layout:** Device default / Light / Dark / Sepia / High Contrast theme, All phrases /
  Grouped phrases, topic visibility and pinning, and All phrases button sizing.
- **Accessibility & dwell:** larger touch targets, Speechy dwell on/off, its
  0.8–3.0 second delay, and iPad Eye Tracking guidance.
- **Phrases & GIFs:** shortcuts to organize phrase tiles and manage GIFs, plus the text shown by the Card button.
- **App & help:** installation, offline access, full screen where available, and the demo guide.
- **Saving & recovery:** the existing backup, retry and restore tools, plus the
  confirmed board reset inside a collapsed section.

Changes apply immediately and save on this device. The footer reports the real
save status, including failures. **Done**, the top Close button, and Escape close
the panel and restore focus to Settings. The contents scroll within phone,
tablet and desktop viewports while the heading and footer remain available.
The board is inactive while a native modal is open. Opening Settings does not
change phrases, the tap mode or the message, and does not create a save.
Quick Dwell, Show/Hide topics and layout controls on the board stay synchronized
with the panel. Restoring a board through Settings updates the open controls.

## Animated GIFs for phrases

Speechy can now display an animated GIF along with a saved phrase, in both **All phrases** and **Grouped phrases**, including on iPad.

1. Tap **GIFs** in the toolbar.
2. Choose a **Topic** and **Phrase**.
3. Paste a **direct GIF image URL** ending in `.gif` (not the page URL for a GIF).
4. Tap **Preview** to check it, then **Save GIF**.

The phrase button gets a small **GIF** label. When you tap it in **Tap speaks** mode, Speechy speaks the phrase and shows the GIF full-screen. Tap **Close GIF** to return to the board. The **Show GIF** button in the speech panel lets you display it again without repeating speech. GIFs do not open automatically when the device requests reduced motion; you can still display them manually.

You can replace or remove a phrase's GIF through **GIFs** at any time. The link is saved alongside other board settings using the current storage backend, so the GIF must remain available online to play. This first version accepts direct online image URLs rather than local GIF uploads.

## Choose a phrase layout

- **All phrases** shows every phrase in the selected topic at once. Use it for
  direct access without opening smaller groups.
- **Grouped phrases** shows smaller groups with labels describing the buttons
  inside. For example, Right now has **Speech & listening**, **Breaks & comfort**,
  and **Typing & showing**. Open a named group, then choose a phrase.

Both choices have a short explanation on their buttons and a visible selected
state. They are also available under **Settings → Appearance & layout**. Both layouts work with
**Tap speaks** and **Tap builds**. Layout choice changes how phrases are shown;
it does not change the saved phrases or the tapping mode. Existing layout
preferences remain compatible.

## Content labels for group panels

Grouped panels use meaningful names such as **Menus & ordering**, **Documents &
follow-up**, and **Instructions & follow-up**. The same name appears on the panel,
in its preview, and in the opened group heading. Standard phrases
are grouped by subject; custom phrases remain available in panels named from the
text they contain. Empty groups are omitted. Starred and Used most group known
phrases by their source topic and use phrase excerpts for unmatched saved text.
This applies to navigation only: the saved phrase text and All phrases view are
unchanged. Saved ordering is respected within each content group.

## Five-minute SLP demonstration

Open Speechy in a full browser tab and choose **Demo guide**. It walks visitors through the following workflow:

1. **Immediate communication:** Select **Quick answers**, open a topic, and tap a complete phrase. The device speaks it aloud.
2. **Message composition:** Select **Tap builds**, combine phrases and the **Add on** category, and use **Say it**.
3. **Navigation and efficiency:** Preview a topic without opening it, use the **☆** on a phrase tile, and visit **★ Starred** or **Used most**. Switch between **Grouped phrases** and **All phrases**.
4. **Communication alternatives:** Use **Show big** for large-text communication, or **Card** to show a customizable introduction to another person.
5. **Personalization and motor access:** Open **Settings** to select an available device voice, change speaking speed, and turn on **Larger buttons and touch targets**. Use **Organize** to add or remove phrase tiles.

Use **■ Stop voice** to interrupt speech at any point. The entire demo works without an account or a clinical setup. Allow sound and test a phrase before a presentation; browser and device speech voices vary.

## Topic row: show, hide, pin, or unpin

**Hide topics / Show topics** stays in the main toolbar, even when navigation is hidden. Under **Settings → Appearance & layout**, use **Show topic navigation** and **Keep the topic row visible while scrolling** for the same visibility preference and pinning. The **All phrases / Grouped phrases** choices remain immediately below **Tap speaks / Tap builds**.

- **Hide topics** collapses the entire horizontal topic row, giving the phrase editor more space. **Show topics** restores it without changing the selected category or any saved phrases.
- Clear **Keep the topic row visible while scrolling** to let the topic row scroll away. Check it to keep the row immediately below the message composer.
- The composer controls remain accessible even when the topic row is hidden or unpinned, so you can always show and pin it again.
- On wide desktop screens, where categories appear in the left sidebar instead of a horizontal row, **Hide topics** collapses that sidebar to widen the workspace. Pinning applies to the horizontal topic row.
- Both choices are remembered in this browser with the existing Speechy settings. New users keep the original behavior: topics visible and pinned.

## Adjustable All phrases button size

Open **Settings → Appearance & layout** and choose **All phrases**. Its **Button size** slider appears in the panel. Decrease the percentage to fit more columns; increase it for larger phrase targets. Changes apply to the board immediately.

- The range is **60%–150%**; the more compact default is **80%**.
- Use **−** and **+** beside the slider to decrease or increase button size by exactly **5%** per tap. These controls and the slider always stay synchronized; the controls disable automatically at 60% and 150%.
- Slider changes update the visible board immediately without interrupting speech or changing any phrases.
- **Reset size** returns the board to 80%.
- The chosen size is saved locally with the existing Speechy preferences and is restored when you reopen the page.
- This control applies only to All phrases; the Grouped phrases stays unchanged.
- The **Larger buttons and touch targets** preference under Settings remains available and works together with this control.

## Compact phrase buttons

Phrase buttons now use less vertical padding and a smaller minimum height, especially in **All phrases**. The layout keeps phrase text visible and allows longer messages to wrap instead of clipping them. On wider screens, longer All phrases phrases use up to two grid columns rather than automatically occupying an entire row.

The **Button size** slider still controls the scale; the default compact size is still **80%**. If larger touch targets are easier to use, turn on **Larger buttons and touch targets** under Settings. Grouped spoken phrase choices also have less unused padding without changing the topic buttons.

## Dwell to tap on pointer and touch devices

Turn **Dwell: On** in the toolbar. With a mouse or trackpad, rest the pointer on
an eligible button until the inside border fills. On a touch screen, hold a finger
or Pencil on the button. Short taps and keyboard activation continue normally.
A visible track and growing progress stroke stay inside the active button border,
leaving the phrase readable.
The border clears on cancellation. Dark mode uses a bright progress color. The
functional countdown stays continuous, including with Reduce Motion enabled;
decorative movement still follows that preference. Rounded corners and the
actual curve length keep the border fill even without changing the dwell delay.

- Under **Settings → Accessibility & dwell**, choose a delay from **0.8 to 3.0 seconds**; the default is
  **1.5 seconds**. The preference is saved on this device.
- Touch holds activate once. Releasing after activation does not select the
  button a second time, even if the board re-renders underneath the finger.
- Moving away, starting a scroll, pointer cancellation, a second touch, or
  leaving the app cancels a pending hold. Panning and pinch zoom remain available.
- Hover supports both pointer and mouse events, including Safari boundary events.
  Move deliberately away after activation to rearm; a stationary pointer cannot
  repeatedly select newly rendered buttons underneath it.
- Open overlays and dialogs limit dwell to their visible controls. The dwell
  toggle, board reset, previous-save restore and phrase star/remove glyphs use
  direct activation.
- **iPad Eye Tracking and AssistiveTouch Dwell Control:** let iPadOS generate
  the tap and leave Speechy's own Dwell off to avoid two timers. Set up Eye
  Tracking under iPad Settings → Accessibility → Eye Tracking on a supported
  model; see [Apple's guide](https://support.apple.com/guide/ipad/ipad2cd35723/ipados).
  Speechy's setting does not turn on iPadOS Eye Tracking.

Browser tests cover pointer and emulated touch sequences. Real iPad/Pencil,
installed-voice playback and Eye Tracking still require testing on the device.

## Design principles

- **User-authored adult language.** An AAC user decides what is communicated; phrase buttons are complete utterances, not automatic interpretations of intent.
- **Multiple access paths.** Touch, mouse, keyboard focus, visible button labels, and an opt-in large-target layout.
- **Discoverable navigation.** Explicit topic previews work on touch devices, not only with mouse hover. Nested and classic layouts coexist.
- **Multimodal output.** Built-in device speech, a large visual message, and a customizable communication card.
- **Personalization without losing continuity.** Custom phrases, phrase removals, favorites, speaking rate, theme, access settings, and usage counts persist in the current browser when storage is available. The two board styles remain available.
- **Optional generative wording.** Where the supported Claude runtime is present, the Make a sentence button may suggest language for user review. On public GitHub Pages it displays the user's original wording instead of making an unsupported external API request. No AI suggestion is spoken without being selected.

## Running and deployment

The application uses `index.html` with local storage and PWA support scripts. There is no account requirement, bundler, or build step. Serve the repository over HTTPS (or localhost for testing) to use offline support. This repository's GitHub Pages URL is:

https://lancepounds.github.io/Speechy/

Open `index.html` in a modern browser for local testing. The project is also linked from the Speechy desktop icon in Lance OS at https://lancepounds.github.io/.

## Storage and privacy limitations

Speechy saves on this device using IndexedDB and a localStorage recovery journal, with visible warnings if saving fails. **GitHub Pages does not provide cross-device synchronization.** Customizations in one browser do not automatically appear on another, and browser data clearing can erase local customizations.

Browser speech synthesis runs through the browser's `SpeechSynthesis` API; voices and actual speech output are device-dependent. Text-to-speech may behave differently across platforms and browser permissions. AI suggestion processing is only attempted when a supported AI runtime is available; do not enter sensitive clinical information into an external feature without understanding that service's privacy practices.

This project does not claim HIPAA compliance, clinical validation, switch scanning, eye-gaze support, or formal AAC assessment features. Its accessibility settings support demonstration and personalization but are not substitutes for individualized access evaluation.

## Manual smoke test before presenting

- On phone-width and desktop-width screens, open nested categories and move between pages; read phrases without clipped text.
- Use Preview under a category on touchscreen or with keyboard focus, then open and close it.
- Speak a phrase, Stop voice, Say again, Star it, and open the Starred category.
- Toggle Tap builds, combine phrases, Say it, and Clear.
- Test Show big, Card, Type something, Organize, and settings.
- Enable Larger buttons, test light/dark theme, and reload to confirm settings persist.
- Open Make a sentence on GitHub Pages and verify it offers the original wording without an API error.
- Use Escape to dismiss dialogs and confirm keyboard focus stays inside an open dialog.

## License

MIT, as specified by the hosting project's licensing terms.



## Device-local saving and offline use

Speechy saves the complete board (phrases, favorites, order, sizes, GIF references,
and settings) to IndexedDB, with an immediate localStorage recovery journal for
edits followed by an immediate close. Existing `aac:board` saves are read without
writing defaults on startup and move to the new format on the next edit. Empty
favorites stay empty when reopening the app.

The **Saving & backups** button next to the save status provides:

- **Retry save** to retry the latest snapshot or reopen saved data after a read
  failure. Pending saves also retry when the app changes visibility or comes
  back online. An unprotected edit triggers the browser's leave-page warning
  where the browser supports it.
- **Restore previous save** to recover the preceding version after confirmation.
  Both localStorage and IndexedDB retain a previous copy. A damaged latest
  record falls back to a valid saved copy instead of overwriting it with defaults.
- **Download backup** to save a portable JSON file containing the complete board
  and the actual uploaded GIFs. Store that file in Files or another safe location.
- **Restore a backup file** to validate the entire file before replacing a board.
  Uploaded GIFs are written under fresh keys and must commit before use, leaving
  previous board references intact. Missing GIFs, malformed board data and
  unsupported file formats are rejected. The previous saved board remains
  available through recovery.

A failed save stays visible; Speechy does not report success for memory-only
changes. Database writes are ordered and compared against the last loaded
version so an older window cannot silently replace a newer committed board.
If another window saved changes, download any edits from the older window
before reloading it. This is conflict protection, not cross-device syncing.
Uploaded GIFs use the `speechy-gifs` database and retry opening after failures.
Previous GIF blobs are retained for recovery, so removing a GIF does not
immediately reclaim its space.

Open Speechy online once and wait for offline readiness in Install app. The
service worker caches the phraseboard, local scripts, manifest and
icons. It falls back to the cache on network errors, HTTP errors or a stalled
connection. Close all Speechy windows and reopen after updates so the waiting
worker can activate. Bump `speechy-shell-v16` in sw.js for future shell releases.

Offline speech needs an installed device voice (marked Offline where the
browser reports it). Test in airplane mode on the actual device. A speech error
falls back to displaying the message. Linked GIFs may need internet; uploaded
GIFs are local. Browser data clearing, app removal, or OS storage eviction can
still remove device data; the downloaded backup is the separate recovery copy.
Persistent storage is requested when supported but is not guaranteed. This web
version requires one online load; a future native App Store build must bundle
its assets for first-launch offline operation.

## Saving regression tests

The app runs without a build step. Development dependencies are only for tests:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:dwell
npm run test:settings
npm run test:groups
```

Storage tests use fake-indexeddb's transaction implementation, including aborted
writes, retries, corruption recovery, immediate-close journaling, stale-window
conflicts and legacy saves. Backup tests verify GIF byte-for-byte round trips
and reject missing or malformed content. The browser test serves the actual app
on localhost and checks phrase/card persistence, empty favorites, uploaded GIF
backup and restore, quota/transaction failures and the Retry UI, previous-save
recovery, window conflicts, a mobile dialog and offline reopening. Set
`CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium executable if needed.

The dwell browser checks use trusted touch sequences, pointer/mouse fallback
events, cancellation, one-shot holds, modal controls and both phrase layouts.

The settings browser test checks modal focus and Escape, live changes and
reload, unchanged messages, quick-control synchronization, nested previous-save
recovery, failed-save retry and panel fit in desktop, iPad-sized, phone and
landscape viewports.

The group-panel browser test checks meaningful names, matching previews and
opened headings, complete phrase coverage, custom edits, favorites and recent
phrases, saved ordering, and label fit at desktop, tablet and phone widths.

Real iPhone/iPad Files downloads, app termination, installed voices and
TestFlight updates still need device testing before App Store release.







