# Starter

**Open `_GUIDE.html` in a browser.** It walks through everything step by
step, and it travels with this folder so it is always there.

Copy this folder. That is the install.

```
cp -r starter/ ../my-new-project/
cd ../my-new-project
python -m http.server 8000
```

Open <http://localhost:8000>. **Not `file://`** - the shell loader uses `fetch`,
which needs http, and the chrome will render empty over the file protocol.

## What is here

```
index.html          English / LTR home page. The canonical skeleton.
index-ar.html       Arabic / RTL. Same structure, translated.
pages/
  content.html      long-form page with a table of contents
  service.html      DGA service page: tabs + service-facts panel
  form.html         multi-step application with a stepper
partials/           EN chrome: topbar (digital stamp), mainnav, footer,
                    cookie popup, accessibility panel
partials-ar/        AR chrome. The a11y panel is NOT duplicated - it
                    translates itself from <html lang>.
theme/
  tokens.css        >>> START HERE. Every design decision goes in this file.
  theme-layered.css sole entry: DGA imports, tokens, and project layers
  hero-main.css     project-only visual skin for the main hero
js/site.js          loads the partials, then re-runs the NDS init sweep
_GUIDE.html         the step-by-step guide. Delete before shipping
js/guide.js         powers _GUIDE.html only. Delete with it
assets/             vendor NDS. DO NOT EDIT.
```

## The one rule

`assets/` is vendor code, byte-identical to what DGA/NDS ships, verified by MD5.
It is meant to be replaced wholesale on a version bump. Every change you make
goes in `theme/`, the partials, or the pages.

Concretely:

- never edit `assets/css/*` or `assets/js/*`
- never set a `--_prefixed` variable, they are component internals
- never write a rule targeting a `.nds-*` class

If a design needs something the public tokens do not expose, check the
component's token table in `../reference/` first. If the knob genuinely does not
exist, that is a design conversation, not a CSS override.

## A note on the accessibility panel's language switch

It does not work, and that is deliberate. DGA ships it with `href="./"`, which
goes to the current directory's index rather than the other language, and its
label has no `lang` attribute so a screen reader says it in the wrong voice.

We leave DGA alone. Use the language switch in the main nav instead (that one is
our markup and it works), or wire the panel's switch up in your own project
script. Do not patch it here.

## Order of work

1. `theme/tokens.css` section 1 - identity. Brand ramp, fonts, logos.
2. `theme/tokens.css` section 2 - semantic tokens. Most of the design lands here.
3. Partials - nav links, footer links, entity name, registration number.
4. Pages - copy the closest layout from `pages/`.

Full walkthrough: `../docs/06-starting-a-project.md`.

## What this starter changes vs stock NDS

Vendor CSS and JS are untouched. These are in our own markup:

- **skip link** on every page, first in the tab order. NDS ships none, which is
  a WCAG 2.4.1 failure.
- **correct language on aria-labels.** Stock NDS leaves Arabic `aria-label`s on
  English pages.
- **arrow icon direction corrected.** The four directional arrows are authored
  RTL-first and mirrored in LTR, so in English `arrow-left-01` is the one that
  points forward.
- **dead assets not copied**: bootstrap (227 KB, referenced by nothing), the
  docs-only showcase CSS/JS, a 4.4 MB screenshot, `.DS_Store`.

Details and reasoning: `../docs/05-audit.md`.

## Trimming the starter

`assets/` is 2.3 MB. The icon webfont is most of it.

Each list below is complete. Half-doing one leaves dead `<link>` tags or a dead
link in the nav, which is why `verify.py` checks for exactly that. Run it after
trimming: if you missed a step it names the file.

### Drop the accessibility panel (~690 KB)

Only 13 of the panel's tile icons are missing from the 70-icon core set, and
that alone is why the icon webfont ships. Nothing else in the starter uses
`hgi hgi-stroke hgi-*`, so the panel and the webfont go together.

1. Delete `partials/accessibility-panel.html`
2. Delete `<div id="shell-a11y"></div>` from **every** page
3. Delete `<script src="assets/js/nds-accessibility.min.js" defer></script>` from every page
4. Delete the `nds-accessibility.min.css` import from `theme/theme-layered.css`
5. Delete the `hgi-rounded-stroke-min.css` import from `theme/theme-layered.css`
6. Delete the files:
   ```
   assets/css/nds-accessibility.min.css
   assets/js/nds-accessibility.min.js
   assets/css/hgi-rounded-stroke-min.css      209 KB
   assets/fonts/hgi-stroke-rounded.woff2      659 KB
   ```

**Think twice on a government project.** The panel is a real accessibility asset
and the strongest compliance story in the whole system.

### Drop a language

Say you are dropping Arabic:

1. Delete `partials-ar/`
2. Delete `index-ar.html`
3. **Delete the language switch from `partials/mainnav.html`** - the
   `<li class="nds-nav-item nds-icon-only lang">` block. Miss this and every
   page has a link to a file that no longer exists.
4. Delete the `IBMPlexSansArabic-*` fonts from `assets/fonts/`

Dropping English instead is the mirror of that, minus the `-Latin1` fonts.

`js/site.js` needs no edit either way: it picks the folder from `<html lang>`,
and the folder you kept is the one it will ask for.

### Drop OpenDyslexic

The dyslexia mode in the accessibility panel falls back to the system font.
Small file, probably keep it.

## Gotchas

1. Content added after page load does not initialise itself. Call
   `NDS.Init.reinitialize()`. Only 9 selectors auto-mount.
2. `hidden` on tabs, drawers, footer, side info and breadcrumbs is deliberate.
   NDS removes it in one batch after init to avoid layout shift.
3. `data-required` goes on `.nds-form-container`, not the input.
4. A form field with no `[data-feedback-target]` silently cannot show errors.
5. Custom `--typo-*` values need `calc(x * var(--user-font-scale, 1))` or the
   accessibility font sizing skips them.

More: `../docs/04-components.md`.
