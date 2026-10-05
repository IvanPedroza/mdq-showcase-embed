# MDQ showcase embed

MDQ Blog Program hero for a fixed 398 px SharePoint iframe.

Run `python3 -m http.server 4173 --bind 127.0.0.1` in this directory, then open
`http://127.0.0.1:4173/` for the banner. The optional local-only `preview.html`
wrapper provides a 398 px desktop/mobile comparison frame.

## Current design

- Microsoft logo and large MDQ Blog Program title; no playback controls.
- Thirteen equal-sized glass discs, equally spaced on one fixed circular orbit.
  A shared phase advances all slots over a 67-second revolution. No slot ever
  pauses or changes its angular separation, including while its card is open.
- A disc becomes a glass rectangle carrying a linked story. Its slot keeps
  moving as the only gap. The rectangle returns to that exact moving slot.
- Timing: minimum 1.6-second gap, 2.4-second emergence, 3-second reading time,
  2.6-second return. Departure is timed for a visible landing. Hover/focus does not extend the
  three-second hold. The orbit continues throughout. If resizing invalidates a
  landing, the card waits for its own slot's next visible return window.
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

The SharePoint iframe is 398 px high (another 10% shorter than 442 px, rounded). By default the animation
respects the visitor's OS reduced-motion preference. If a desktop reports
reduced motion but animation is intentionally required, explicitly opt in with
`https://ivanpedroza.github.io/mdq-showcase-embed/?motion=on` as the iframe URL.
This affects only this banner; it does not change device settings. Hidden tabs
and offscreen frames still suspend rendering. Remove the query to restore the
OS preference. Keep all published content public. Preview screenshots and local
review notes are excluded.

## SharePoint embed

Edit the Embed web part, replace its iframe code, then republish. Leave
"Resize to fit the page" off so SharePoint keeps the intended height:

```html
<iframe src="https://ivanpedroza.github.io/mdq-showcase-embed/?motion=on" width="100%" height="398" title="MDQ Blog Program showcase" style="border:0" loading="lazy"></iframe>
```

## Verification

Run `node tests/orbit.test.cjs` for fixed-center, circle-radius, spacing,
one-gap, visible landing, delayed-return and responsive geometry checks.
Run `node tests/animation-timing.test.cjs` to verify the real animation state
machine keeps the readable hold to three seconds across frame rates and layouts.
The ignored `design-qa.md` records browser checks and preview screenshots.
