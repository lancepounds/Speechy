# Speechy

A single-file AAC (augmentative and alternative communication) board, styled after Windows Vista.

Tap a sentence and the phone says it out loud. No install, no account, no build step. The whole
application is one HTML file.

## Why it exists

Most AAC boards are built around single words and short fragments, which makes an adult sound
clipped. Every tile in Speechy is a complete, natural sentence in the voice of a working
professional.

## Features

- **220+ sentences** across 13 categories: quick answers, questions, meeting people, work,
  hearings and calls, church, eating out, getting around, appointments, and an off-duty joke set.
- **Tap speaks** for one-tap output, or **Tap builds** to assemble a longer sentence from parts.
- **Add on** fragments ("before Friday", "if that works for you", "with my co-counsel") attach to
  the end of a sentence and fix the punctuation as they go.
- **Make a sentence** turns typed shorthand into three finished sentences. Requires the Claude
  runtime; see Limitations.
- **Show big** fills the screen with the sentence, auto-sized, for loud rooms or quiet ones where
  a synthetic voice would be awkward.
- **Card** is a full-screen explainer to hand to a stranger. Editable.
- **Used most** self-populates by frequency, so your real vocabulary rises to the top.
- **Search** across every phrase at once.
- **Edit** to delete tiles you would never say and add your own.
- Light and dark themes, following the system by default.
- Everything persists. Custom phrases, deletions, voice settings, theme.

## Where it lives

This folder sits inside the `lancepounds.github.io` repository, so GitHub Pages serves it
automatically at:

    https://lancepounds.github.io/speechy/

No build step and no Pages configuration. Committing the folder is the whole deployment.

To run it locally, open `index.html` in a browser.

On a phone, open the URL and use **Add to Home Screen** so it launches full screen with its own
icon.

## How it stores things

Speechy writes to whichever backend it finds, in this order:

1. The Claude artifact database, which syncs across the user's own devices.
2. `window.storage`, when running inside a Claude artifact preview.
3. `localStorage`, which is what a plain web host such as GitHub Pages will use.
4. Memory only, if all of the above are unavailable. The board still works; nothing is kept.

## Limitations

- **Speech depends on the device.** Speechy uses the browser's built-in `SpeechSynthesis` API.
  Voice quality and availability vary, and some devices have none. Show big and the card are the
  fallback and need no voice at all.
- **Make a sentence needs Claude.** Hosted on GitHub Pages, that button has nothing to call and
  will report that it could not connect. Everything else works normally.
- **localStorage does not sync.** On a plain web host, phrases added on a laptop will not appear
  on a phone.

## Customising

The content lives in three arrays near the top of the `<script>` block in `index.html`:

- `CATS` — the categories, their colors, and their behaviour flags
- `BASE` — the sentences, keyed by category id
- `JOKE_GROUPS` — the off-duty set

Edit those and the interface rebuilds itself. No tooling required.

## License

MIT, under the license at the root of this site's repository.
