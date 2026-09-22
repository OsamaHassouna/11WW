# 11th World Water Forum

> Action for a Better Tomorrow

Front-end for the **11th World Water Forum**, held in **Riyadh, Saudi Arabia,
21-25 March 2027**, and hosted by the Kingdom's Ministry of Environment, Water
& Agriculture (MEWA) together with the World Water Council.

The Forum is the world's largest water-related event, expected to bring
together more than 20,000 participants from over 150 countries to shape global
water governance and action.

This repository is a redesign of [11thworldwaterforum.org](https://11thworldwaterforum.org/),
rebuilt on the Saudi **National Design System**.

## Highlights

- **Bilingual** English and Arabic, with full right-to-left support driven by a
  single `dir` attribute
- **No build step.** Static HTML, CSS and vanilla JavaScript. Clone it, serve
  the folder, done. No bundler, no package install, no toolchain to keep alive
- **Design-system native.** Every visual decision is a design token, so the
  whole site re-themes from one file
- **Accessible by default.** Skip links, a full accessibility panel with seven
  profiles, high contrast, dyslexia-friendly typography, reduced motion,
  user-controlled font scaling and a reading mask
- **Light and dark themes**, applied before first paint so there is no flash

## Quick start

No dependencies. Serve the folder over HTTP with anything you like:

```bash
python -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000>.

> **Serve it over HTTP, not `file://`.** The shared chrome is injected with
> `fetch()`, which the file protocol blocks, so the header, footer and hero
> would render empty.

## Project structure

```
index.html          English home page
index-ar.html       Arabic home page
pages/              sub-pages
partials/           shared English chrome: topbar, navigation, footer,
                    cookie notice, hero, accessibility panel
partials-ar/        shared Arabic chrome
theme/
  tokens.css        design tokens. Colour, type, spacing, radius.
  theme-layered.css the single stylesheet each page links. Owns the
                    design-system imports and all project components.
  media/            images, video, favicons
js/site.js          shell loader and page behaviour
assets/             the National Design System. Vendored, unmodified.
```

## How a page works

Each page is a thin shell plus its own content:

1. `<base href>` is set for the page's depth, `./` at the root and `../` under
   `pages/`, and every asset path is written relative to it.
2. Empty placeholders mark the shared chrome: `#shell-topbar`,
   `#shell-mainnav`, `#shell-footer`, `#shell-cookie`, `#shell-a11y`.
3. `js/site.js` fetches the matching partial into each placeholder, choosing
   `partials/` or `partials-ar/` from `<html lang>`.
4. It re-runs the design system's initialisation, because the vendor bundle
   scans the DOM once on `DOMContentLoaded` and the chrome arrives after that.

Three small inline scripts in `<head>` restore the saved theme, accessibility
and session state before the first paint, which is what prevents a flash of
unstyled or unthemed content. They need to stay where they are.

**To add a page**, copy the closest existing one, set `<base href>` correctly
for its depth, keep the shell placeholders, and write your content into
`<main>`.

## Styling

`assets/` is the vendored National Design System and is never edited. It is
meant to be replaced wholesale when the system is upgraded.

Everything the project adds goes in `theme/`:

- `theme/tokens.css` first. It is ordered identity, then semantic tokens, then
  component tokens, and most design changes only ever touch it.
- `theme/theme-layered.css` for components the design system does not cover.
  Project styles are prefixed `wwf-` and sit in a cascade layer above the
  vendor styles.

House rules, carried over from the design system:

- never set a `--_prefixed` variable, those are component internals
- never write a selector targeting a `.nds-*` class, set the public token the
  component already reads
- when overriding a `--typo-*` value, wrap it in
  `calc(x * var(--user-font-scale, 1))` so the accessibility panel's font
  sizing keeps working

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The stylesheet uses
cascade layers and logical properties; the scripts use `IntersectionObserver`.

## Status

Under active development ahead of the March 2027 Forum. The English home page
and the legal pages are the furthest along; further sections and the Arabic
translation are in progress.

## Credits

Built on [NDS-vanilla](https://github.com/mazin-musleh/NDS-vanilla) by Mazin
Musleh (MIT), an independent plain-HTML implementation of the Saudi Digital
Government Authority's National Design System. It is not affiliated with, nor
endorsed by, the DGA.

Forum branding, imagery and content belong to their respective owners.
