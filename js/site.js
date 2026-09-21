/**
 * Starter shell loader
 * -----------------------------------------------------------------------------
 * Fetches the shared chrome (topbar, nav, footer, cookie bar, a11y panel) into
 * placeholder elements, then tells NDS to initialise what just arrived.
 *
 * WHY THIS EXISTS
 * The NDS bundle takes one DOM sweep on DOMContentLoaded. Anything injected
 * after that point is invisible to it, so we re-run the sweep once the partials
 * land. NDS.Mainnav in particular caches its DOM refs at parse time, which is
 * why the nav interactions are re-bound here rather than left to the bundle.
 *
 * Adapted from reference/assets/js/nds-includes.js. That file is the vendor's
 * documentation-site loader; this is the trimmed version for a real project.
 *
 * IF YOU HAVE A BACKEND OR A BUILD STEP
 * Delete this file and include the partials server-side (PHP include, Nunjucks,
 * Liquid, whatever). It removes the fetch waterfall and the re-init entirely.
 * This exists so the starter works by opening a file with zero tooling.
 *
 * NOTE: fetch() requires http(s). Opening index.html via file:// will leave the
 * placeholders empty. Run `python -m http.server` or `npx serve .` from this
 * folder.
 */
(function () {
    'use strict';

    // Chrome is per-language. The accessibility panel is not: it carries 28
    // translation hooks (20 data-i18n + 8 data-i18n-attr) and translates itself
    // from <html lang> against assets/i18n/accessibility/{lang}.json, so one
    // copy serves both, exactly as dga-html ships it.
    var isArabic = (document.documentElement.lang || 'en').toLowerCase().indexOf('ar') === 0;
    var dir = isArabic ? 'partials-ar/' : 'partials/';

    var PARTIALS = [
        { id: 'shell-topbar', file: dir + 'topbar.html' },
        { id: 'shell-mainnav', file: dir + 'mainnav.html' },
        { id: 'shell-footer', file: dir + 'footer.html' },
        { id: 'shell-cookie', file: dir + 'cookie-popup.html' },
        { id: 'shell-a11y', file: 'partials/accessibility-panel.html' }
    ];

    // NOTE: do not prepend the <base href> here. fetch() already resolves a
    // relative URL against the document's base URL, so adding it again
    // double-applies it and every partial 404s from pages/ in a sub-path
    // deployment.
    var loads = PARTIALS.map(function (p) {
        var host = document.getElementById(p.id);
        if (!host) return Promise.resolve();

        return fetch(p.file)
            .then(function (res) {
                if (!res.ok) throw new Error(p.file + ' -> ' + res.status);
                return res.text();
            })
            .then(function (html) {
                host.innerHTML = html;
                // innerHTML does not execute scripts. Re-create any that came in.
                host.querySelectorAll('script').forEach(function (old) {
                    var s = document.createElement('script');
                    if (old.type) s.type = old.type;
                    if (old.src) s.src = old.src; else s.textContent = old.textContent;
                    old.parentNode.replaceChild(s, old);
                });
            })
            .catch(function (err) {
                console.warn('[shell] partial failed:', err.message);
            });
    });

    var domReady = new Promise(function (resolve) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });

    Promise.all([Promise.all(loads), domReady]).then(function () {
        markActiveNav();
        applyPageMeta();
        document.dispatchEvent(new CustomEvent('shell:ready'));

        if (typeof NDS !== 'undefined') {
            // Idempotent: components guard themselves with data-nds-*-initialized.
            if (NDS.Init && NDS.Init.reinitialize) NDS.Init.reinitialize();
            if (NDS.TimeDate && NDS.TimeDate.init) {
                try { NDS.TimeDate.init(); } catch (e) { /* clock is optional */ }
            }
        }

        revealChrome();
        bindNavDropdowns();
        bindMobileNav();
        bindDigitalStamp();
    });

    /* --- active nav state ------------------------------------------------- */
    function markActiveNav() {
        var here = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nds-nav-primary a[href]').forEach(function (a) {
            var target = a.getAttribute('href').split('/').pop();
            if (target && target === here) {
                a.setAttribute('aria-current', 'page');
                addStateToken(a, 'active');
            }
        });
    }

    /* --- page title/description into the sub hero ------------------------- */
    function applyPageMeta() {
        var page = document.querySelector('[data-page-title]');
        if (!page) return;
        var hero = document.querySelector('.nds-hero-section.nds-sub');
        if (!hero) return;
        var title = page.getAttribute('data-page-title');
        var desc = page.getAttribute('data-page-description');
        var h1 = hero.querySelector('.nds-section-title');
        var p = hero.querySelector('.nds-section-description');
        if (title && h1) h1.textContent = title;
        if (desc && p) p.textContent = desc;
    }

    /* --- NDS ships chrome hidden, reveal once it is wired ------------------ */
    function revealChrome() {
        var sel = [
            '.nds-digitalStamp-tab[hidden]',
            '.nds-nav-minimal[hidden]',
            '.nds-collapse[hidden]',
            '.nds-nav-primary[hidden]',
            '.nds-nav-actions[hidden]'
        ].join(',');
        document.querySelectorAll(sel).forEach(function (el) {
            el.removeAttribute('hidden');
        });
    }

    /* =========================================================================
       CHROME INTERACTIONS - a faithful copy of the vendor's own loader
       -------------------------------------------------------------------------
       Everything below is transcribed from
       reference/assets/js/nds-includes.js, deliberately unchanged: same
       predicates, same 300/350ms timings, same Escape scope. The only edit is
       the collapse element's id, which the starter renames to
       shellNavCollapse.

       DO NOT "IMPROVE" THIS CODE.
       It looks like it has bugs. Those are real DGA behaviours, and a project
       built on this starter must behave exactly like the DGA reference site.
       Every one of them was "fixed" here once and had to be reverted; they are
       listed with their symptoms under "Deliberately NOT fixed" in
       ../../docs/05-audit.md. The short version:

         - `open` stays in data-state for the whole close transition, so
           clicking a dropdown or the hamburger mid-close re-closes it instead
           of reopening. Verified side by side against dga-html.
         - Escape closes dropdowns and the mobile nav, but NOT the digital
           stamp, which is left with aria-expanded="true".
         - The transition timers are never cancelled, so toggling faster than
           300/350ms lets a stale timer land on the new state.

       If a project genuinely needs different behaviour, do it in that project's
       own script, not here.
       ====================================================================== */

    /* --- nav dropdowns ----------------------------------------------------- */
    function bindNavDropdowns() {
        document.addEventListener('click', function (e) {
            var trigger = e.target.closest('.nds-main-nav .nds-dropdown > .nds-nav-link');
            if (trigger) {
                e.preventDefault();
                var dd = trigger.closest('.nds-dropdown');
                var isOpen = hasState(dd, 'open');

                closeAllDropdowns(dd);

                if (isOpen) {
                    closeDropdown(dd);
                } else {
                    openDropdown(dd);
                }
                return;
            }

            if (e.target.closest('.nds-mainNav-toggler')) {
                e.preventDefault();
                return; // handled by bindMobileNav
            }

            var openDDs = document.querySelectorAll('.nds-main-nav .nds-dropdown[data-state~="open"]');
            openDDs.forEach(function (dd) {
                var menu = dd.querySelector('.nds-dropdown-menu');
                if (!dd.contains(e.target) && (!menu || !menu.contains(e.target))) {
                    closeDropdown(dd);
                }
            });

            var collapse = document.getElementById('shellNavCollapse');
            if (collapse && hasState(collapse, 'open')) {
                var nav = document.querySelector('.nds-main-nav');
                if (nav && !nav.contains(e.target)) {
                    closeMobileNav(collapse);
                }
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeAllDropdowns();
                var collapse = document.getElementById('shellNavCollapse');
                if (collapse && hasState(collapse, 'open')) {
                    closeMobileNav(collapse);
                }
            }
        });
    }

    function openDropdown(dd) {
        var link = dd.querySelector('.nds-nav-link');
        dd.setAttribute('data-state', 'open opening');
        if (link) addStateToken(link, 'active');
        setTimeout(function () {
            dd.setAttribute('data-state', 'open opened');
        }, 300);
    }

    function closeDropdown(dd) {
        var link = dd.querySelector('.nds-nav-link');
        dd.setAttribute('data-state', 'open closing');
        if (link) removeStateToken(link, 'active');
        setTimeout(function () {
            dd.removeAttribute('data-state');
        }, 300);
    }

    function closeAllDropdowns(except) {
        var openDDs = document.querySelectorAll('.nds-main-nav .nds-dropdown[data-state~="open"]');
        openDDs.forEach(function (dd) {
            if (dd !== except) closeDropdown(dd);
        });
    }

    /* --- mobile nav -------------------------------------------------------- */
    function bindMobileNav() {
        var toggler = document.querySelector('.nds-mainNav-toggler button');
        var collapse = document.getElementById('shellNavCollapse');
        if (!toggler || !collapse) return;
        if (toggler.hasAttribute('data-nds-bound')) return;
        toggler.setAttribute('data-nds-bound', '');

        toggler.addEventListener('click', function (e) {
            e.preventDefault();
            var isOpen = hasState(collapse, 'open');
            if (isOpen) {
                closeMobileNav(collapse);
                toggler.setAttribute('aria-expanded', 'false');
            } else {
                collapse.style.display = '';
                collapse.setAttribute('data-state', 'open opening');
                toggler.setAttribute('aria-expanded', 'true');
                setTimeout(function () {
                    collapse.setAttribute('data-state', 'open opened');
                }, 300);
            }
        });
    }

    function closeMobileNav(collapse) {
        collapse.setAttribute('data-state', 'open closing');
        var toggler = document.querySelector('.nds-mainNav-toggler button');
        if (toggler) toggler.setAttribute('aria-expanded', 'false');
        setTimeout(function () {
            collapse.removeAttribute('data-state');
        }, 300);
    }

    /* --- DGA digital stamp ------------------------------------------------- */
    function bindDigitalStamp() {
        var tab = document.querySelector('.nds-digitalStamp-tab');
        var stamp = document.getElementById('nds-digitalStamp');
        if (!tab || !stamp) return;
        if (tab.hasAttribute('data-nds-bound')) return;
        tab.setAttribute('data-nds-bound', '');

        tab.addEventListener('click', function () {
            var isOpen = hasState(stamp, 'open');
            if (isOpen) {
                stamp.setAttribute('data-state', 'open closing');
                tab.setAttribute('aria-expanded', 'false');
                removeStateToken(tab, 'expanded');
                setTimeout(function () {
                    stamp.removeAttribute('data-state');
                    stamp.style.display = 'none';
                }, 350);
            } else {
                closeAllDropdowns();
                stamp.removeAttribute('hidden');
                stamp.style.display = '';
                stamp.setAttribute('data-state', 'open opening');
                tab.setAttribute('aria-expanded', 'true');
                addStateToken(tab, 'expanded');
                setTimeout(function () {
                    stamp.setAttribute('data-state', 'open opened');
                }, 350);
            }
        });
    }

    /* --- state helpers (verbatim from the vendor loader) -------------------- */
    function hasState(el, token) {
        var state = (el.getAttribute('data-state') || '').trim();
        return state.split(/\s+/).indexOf(token) !== -1;
    }

    function addStateToken(el, token) {
        var current = (el.getAttribute('data-state') || '').trim();
        if (current.split(/\s+/).indexOf(token) === -1) {
            el.setAttribute('data-state', (current + ' ' + token).trim());
        }
    }

    function removeStateToken(el, token) {
        var current = (el.getAttribute('data-state') || '').trim();
        var parts = current.split(/\s+/).filter(function (t) { return t !== token; });
        if (parts.length) {
            el.setAttribute('data-state', parts.join(' '));
        } else {
            el.removeAttribute('data-state');
        }
    }
})();
