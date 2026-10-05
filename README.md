# MDQ showcase embed

MDQ Blog Program hero for a fixed 520 px SharePoint iframe.

Run `python3 -m http.server 4173 --bind 127.0.0.1` in this directory, then open
`http://127.0.0.1:4173/` for the banner. The optional local-only `preview.html`
wrapper provides a 520 px desktop/mobile comparison frame.

## Current design

- Microsoft logo and large MDQ Blog Program title; no playback controls.
- Thirteen equal-sized glass discs, equally spaced on one fixed circular orbit.
  A shared phase advances all slots over a 160-second revolution. No slot ever
  pauses or changes its angular separation, including while its card is open.
- A disc becomes a glass rectangle carrying a linked story. Its slot keeps
  moving as the only gap. The rectangle returns to that exact moving slot.
- Timing: minimum 1.6-second gap, 2.4-second emergence, 14-second reading time,
  2.6-second return. Departure is timed for a visible landing. Hover/focus holds
  the story while the orbit continues. After a very long reading hold, the card
  waits for its own slot's next visible return window.
- One WebGL canvas renders every disc and the morphing panel. High-precision
  shader arithmetic, supersampling, mipmaps, lossless textures and premultiplied
  alpha smooth the rims. Occlusion blends as the card moves forward/back; there
  is no switch between separate CSS and canvas renderers during handoff.
  The card has a uniform 3.5 px glass rim and equal 22 px rounded corners; its
  interior retains the original Blender glass texture.
- A CSS fallback supports unavailable WebGL. OS reduced-motion preference shows
  a stationary card and orbit; hidden/offscreen frames suspend animation work.

## Content and files

`stories.json` contains public article titles and HTTPS URLs. The optional
`stories` query accepts a same-origin path. Six built-in articles provide fallback.
Links open in a new tab with `noopener noreferrer`.

GitHub Pages publishes `main` at https://ivanpedroza.github.io/mdq-showcase-embed/.
The deployment includes `index.html`, `glass-morph.js`,
`orbit-motion.js`, `stories.json`, and both `assets/*.webp` files. Textures total
1,001,694 bytes. The PNG is the source render and not a runtime dependency.
No CDN or third-party runtime dependencies. All asset requests are same-origin.

The SharePoint embed URL and fixed 520 px height remain unchanged. Keep all
published content public. Preview screenshots and local review notes are excluded.

## Verification

Run `node tests/orbit.test.cjs` for fixed-center, circle-radius, spacing,
one-gap, visible landing, long-hold and responsive geometry checks.
The ignored `design-qa.md` records browser checks and preview screenshots.
