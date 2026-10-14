# Speechy

**Speechy is a personal, browser-based augmentative and alternative communication (AAC) phraseboard.** It emphasizes complete, natural-sounding adult language and fast participation in everyday conversations, meetings, appointments, and community life. Its visual design takes inspiration from Windows XP.

**Open the live board:** https://lancepounds.github.io/Speechy/

Speechy is a personal prototype, not a standardized AAC assessment or a clinically validated replacement for a person's prescribed communication system.

## Five-minute SLP demonstration

Open Speechy in a full browser tab and choose **Demo guide**. It walks visitors through the following workflow:

1. **Immediate communication:** Select **Quick answers**, open a topic, and tap a complete phrase. The device speaks it aloud.
2. **Message composition:** Select **Tap builds**, combine phrases and the **Add on** category, and use **Say it**.
3. **Navigation and efficiency:** Preview a topic without opening it, use **☆ Star** after speaking a phrase, and visit **★ Starred** or **Used most**. Switch between **Nested style** and **Old style**.
4. **Communication alternatives:** Use **Show big** for large-text communication, or **Card** to show a customizable introduction to another person.
5. **Personalization and motor access:** Open **Voice** to select an available device voice, change speaking speed, and turn on **Larger buttons (motor access)**. Use **Organize** to add or remove phrase tiles.

Use **■ Stop voice** to interrupt speech at any point. The entire demo works without an account or a clinical setup. Allow sound and test a phrase before a presentation; browser and device speech voices vary.

## Topic row: show, hide, pin, or unpin

**At the top of Speechy, next to its name in the main toolbar**, are the clearly labeled **Hide topics / Show topics** controls and, on smaller screens, **Pin topics / Unpin topics**. They stay visible even when all topic navigation is hidden. The Old Style / Nested style switch remains immediately below **Tap speaks / Tap builds**.

- **Hide topics** collapses the entire horizontal topic row, giving the phrase editor more space. **Show topics** restores it without changing the selected category or any saved phrases.
- **Unpin row** allows the topic row to scroll away when you browse phrases. **Pin row** makes it stay immediately below the message composer while scrolling.
- The composer controls remain accessible even when the topic row is hidden or unpinned, so you can always show and pin it again.
- On wide desktop screens, where categories appear in the left sidebar instead of a horizontal row, **Hide topics** collapses that sidebar to widen the workspace. Pinning applies to the horizontal topic row.
- Both choices are remembered in this browser with the existing Speechy settings. New users keep the original behavior: topics visible and pinned.

## Adjustable Old Style button size

Select **Old style** (or **Switch to Old Style**). A **Button size** slider appears immediately above the phrases. Move toward **Smaller** to use less space and fit more columns; move toward **Larger** for bigger, more comfortable phrase targets.

- The range is **60%–150%**; the more compact default is **80%**.
- Use **−** and **+** beside the slider to decrease or increase button size by exactly **5%** per tap. These controls and the slider always stay synchronized; the controls disable automatically at 60% and 150%.
- Slider changes update the visible board immediately without interrupting speech or changing any phrases.
- **Reset size** returns the board to 80%.
- The chosen size is saved locally with the existing Speechy preferences and is restored when you reopen the page.
- This control applies only to Old Style; the Nested style stays unchanged.
- The **Larger buttons (motor access)** preference under Voice remains available and works together with this control.

## Compact phrase buttons

Phrase buttons now use less vertical padding and a smaller minimum height, especially in **Old Style**. The layout keeps phrase text visible and allows longer messages to wrap instead of clipping them. On wider screens, longer Old Style phrases use up to two grid columns rather than automatically occupying an entire row.

The **Button size** slider still controls the scale; the default compact size is still **80%**. If larger touch targets are easier to use, turn on **Larger buttons (motor access)** under Voice. Nested-style spoken phrase choices also have less unused padding without changing the topic buttons.

## Dwell to tap (mouse or eye-tracking pointer)

Use the **Dwell: Off / Dwell: On** toggle in Speechy's main toolbar. When enabled, hold the pointer over a speech or navigation button until its progress bar fills; it activates the same action as a click, without physically clicking.

- Default is **Off**, so existing clicking, tapping, and keyboard use are unchanged.
- The delay defaults to **1.5 seconds**. Under **Voice**, adjust **Dwell to tap delay** from **0.8 to 3.0 seconds**.
- Moving away from a button before the delay expires cancels that selection. After an activation, move deliberately to another button before another dwell selection can begin, preventing accidental repeat speech when the board re-renders.
- **Dwell: Off** can always be clicked normally. The destructive **Reset board** action is deliberately excluded from dwell activation.
- Dwell is intended for mouse-compatible pointers, including assistive pointing devices that emulate a mouse. Touch continues to use regular taps. It is **not a built-in camera eye-tracking system** and has not been clinically validated.
- The on/off preference and delay are saved with other board settings on this device; phrase data is unchanged.

## Design principles

- **User-authored adult language.** An AAC user decides what is communicated; phrase buttons are complete utterances, not automatic interpretations of intent.
- **Multiple access paths.** Touch, mouse, keyboard focus, visible button labels, and an opt-in large-target layout.
- **Discoverable navigation.** Explicit topic previews work on touch devices, not only with mouse hover. Nested and classic layouts coexist.
- **Multimodal output.** Built-in device speech, a large visual message, and a customizable communication card.
- **Personalization without losing continuity.** Custom phrases, phrase removals, favorites, speaking rate, theme, access settings, and usage counts persist in the current browser when storage is available. The two board styles remain available.
- **Optional generative wording.** Where the supported Claude runtime is present, the Make a sentence button may suggest language for user review. On public GitHub Pages it displays the user's original wording instead of making an unsupported external API request. No AI suggestion is spoken without being selected.

## Running and deployment

The application is the single `index.html` file in this repository. There is no install, account requirement, bundler, or build step. This repository's GitHub Pages URL is:

https://lancepounds.github.io/Speechy/

Open `index.html` in a modern browser for local testing. The project is also linked from the Speechy desktop icon in Lance OS at https://lancepounds.github.io/.

## Storage and privacy limitations

Speechy chooses the available storage backend: a supported Claude artifact database, `window.storage` in a compatible preview, browser `localStorage` on a standalone website, or in-memory state if storage is blocked. **GitHub Pages does not provide cross-device synchronization.** Customizations in one browser do not automatically appear on another, and browser data clearing can erase local customizations.

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
