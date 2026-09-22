# 11th World Water Forum

Event site for the **11th World Water Forum**, Riyadh, **21-25 March 2027**.
Jointly organised by the Saudi Ministry of Environment, Water & Agriculture
(MEWA) and the World Water Council.

Bilingual EN/AR. Static HTML, CSS and vanilla JS. No build step, no framework,
no dependencies to install.

Built on the Saudi **DGA National Design System** (NDS-vanilla v1.0.4) via the
in-house `dga-kit` starter.

## Status

Work in progress. Be specific about what exists before trusting a page:

| Page | State |
|---|---|
| `index.html` | EN home. The real page. Still being built. |
| `pages/privacy-policy.html` | done |
| `pages/terms-of-use.html` | done |
| `index-ar.html` | **untouched starter placeholder.** The nav links to it. |
| `pages/content.html`, `form.html`, `service.html` | untouched starter examples |
| `pages/templates/` | DGA reference layouts, not part of the site (git-ignored) |

Home page sections, in order: hero, milestones, core processes, global water
dialogue, news, organizers, stay connected.

Roughly 20 further pages are planned.

## Run it

```bash
python -m http.server 8000
# then open http://localhost:8000
```

**Do not open `index.html` with `file://`.** The shared chrome is injected with
`fetch()`, which needs http, so over `file://` the header, footer, hero and
cookie bar all render empty.

Prefer the clean URL `http://localhost:8000/` over
`http://localhost:8000/index.html`. With `<base href>` set, the two are not
equivalent for same-page anchors. See Known issues.

## Structure

```
index.html            EN home
index-ar.html         AR home (placeholder)
pages/                sub-pages
partials/             EN chrome: topbar, mainnav, footer, cookie bar,
                      hero-main, accessibility panel
partials-ar/          AR chrome. The a11y panel is NOT duplicated; it
                      translates itself from <html lang>.
theme/
  tokens.css          design tokens. Most design changes belong here.
  theme-layered.css   the only stylesheet a page links. Owns the DGA
                      imports and every `wwf-` component style.
  theme.css           unused, superseded by theme-layered.css
  media/              project images, video, favicons
js/site.js            shell loader: injects partials, re-runs NDS init,
                      wires nav + digital stamp, lazy-loads the hero video
js/guide.js           orphaned, its page was deleted
assets/               vendor DGA/NDS. DO NOT EDIT.
```

## How a page is assembled

Every page is a shell plus content:

1. `<base href>` is set per depth: `./` at the root, `../` under `pages/`.
   All asset paths are written relative to it.
2. Empty divs mark the chrome: `#shell-topbar`, `#shell-mainnav`,
   `#shell-hero-main`, `#shell-footer`, `#shell-cookie`, `#shell-a11y`.
3. `js/site.js` fetches the matching partial into each one, picking
   `partials/` or `partials-ar/` from `<html lang>`.
4. It then re-runs the NDS init sweep, because the vendor bundle only scans
   the DOM once on `DOMContentLoaded` and everything above arrives later.

Three inline guard scripts in `<head>` apply the saved theme, accessibility
and auth state before first paint. They are not boilerplate, do not trim them.

To add a page: copy the closest existing one, keep the `<base href>` correct
for its depth, keep the shell divs, and write the content into `<main>`.

## Styling rules

`assets/` is vendor code, byte-identical to what DGA ships, meant to be
replaced wholesale on a version bump.

- never edit `assets/css/*` or `assets/js/*`
- never set a `--_prefixed` variable, those are component internals
- never write a rule targeting a `.nds-*` class
- project styles are prefixed `wwf-` and live in `theme/theme-layered.css`
  under `@layer components`
- if you override a `--typo-*` value, wrap it in
  `calc(x * var(--user-font-scale, 1))` or the accessibility panel's font
  sizing stops working on it

Theming is done by declaring the public token a component already reads, not
by out-specifying it. `theme/tokens.css` is organised identity -> semantic ->
component, and is the first place to look.

## Media

- `theme/media/hero-video.mp4` is 12 MB, lazy-loaded by `js/site.js` once the
  hero scrolls into view, with `hero-poster.webp` shown until then.
- `theme/media/hero-video-original.mp4` is the 162 MB source. Git-ignored,
  kept locally for re-encoding. Do not deploy it.
- `theme/media/png/` holds full-size PNG sources for the WebP files actually
  used. Git-ignored, not deployed.

## Known issues

Tracked deliberately, not forgotten. Fix before launch:

- **Placeholder metadata.** `<title>` and `meta description` on both home
  pages are still the starter's. No Open Graph or `hreflang` tags.
- **Primary CTA contrast is 2.64:1** (white on `#ff781f`). WCAG AA needs 4.5:1
  and it misses even the 3:1 large-text floor.
- **Hero video has no pause control** and ignores reduced motion, including
  the accessibility panel's own setting. WCAG 2.2.2 Level A.
- **`<base href>` breaks same-page anchors** when the URL is `/index.html`
  rather than `/`: fragment links resolve against the base, not the document,
  so the skip link and in-page links trigger a full page reload. Serve at `/`,
  or drop `<base>` and write `index.html#section`.
- **Countdown is hardcoded**, nothing ticks it.
- **Footer accessibility links are inert** (`#ndsAccessibilityPanel` is hidden
  and the vendor script has no hash handling), footer last-modified date is a
  placeholder, and the hero CTA points at a section that does not exist.
- **Brand identity is not applied.** `tokens.css` section 1 is still
  commented out, so stock DGA green shows through in places.

## Open question: is this a government entity site?

The topbar currently ships the DGA digital stamp, the Saudi flag and the claim
"A government website registered with the Digital Government Authority", with a
placeholder registration number.

The default NDS visual identity is licensed to Saudi government entities only.
**This has to be confirmed before launch.** If 11WW is not a registered
`.gov.sa` entity, the stamp block must be removed from `partials/topbar.html`
and the identity tokens rebranded.
