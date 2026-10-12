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
