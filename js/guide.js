/**
 * _GUIDE.html only. Copy buttons + table-of-contents highlighting.
 * Delete this together with _GUIDE.html when you ship the site.
 */
(function () {
    'use strict';

    /* Longer snippets live here rather than in a data- attribute, so the HTML
       stays readable. The key matches data-copy on the button. */
    var SNIPPETS = {
        ramp:
':root {\n' +
'    --colors-primary-sa-flag-25:  #fdf5f7;\n' +
'    --colors-primary-sa-flag-50:  #fbeaef;\n' +
'    --colors-primary-sa-flag-100: #f5ccd8;\n' +
'    --colors-primary-sa-flag-200: #eda9bd;\n' +
'    --colors-primary-sa-flag-300: #e07d99;\n' +
'    --colors-primary-sa-flag-400: #cf5175;\n' +
'    --colors-primary-sa-flag-500: #b02a52;\n' +
'    --colors-primary-sa-flag-600: #8B1538;\n' +
'    --colors-primary-sa-flag-700: #74122f;\n' +
'    --colors-primary-sa-flag-800: #5d0e26;\n' +
'    --colors-primary-sa-flag-900: #46091d;\n' +
'    --colors-primary-sa-flag-950: #2c0512;\n' +
'\n' +
'    /* DGA writes its green twice. This copy is read 25 times, the plain\n' +
'       -600 only 9. Skip it and most of the site stays green. */\n' +
'    --colors-primary-sa-flag-600-primary: #8B1538;\n' +
'\n' +
'    /* The footer uses a separate green ramp, so point it at yours. */\n' +
'    --background-footer: var(--colors-primary-sa-flag-900);\n' +
'}',

        font:
'@font-face {\n' +
'    font-family: "YourFont";\n' +
'    src: url("../assets/fonts/YourFont.woff2") format("woff2");\n' +
'    font-display: swap;\n' +
'}',

        skeleton:
'<main id="main-content" tabindex="-1">\n' +
'\n' +
'  <section class="nds-hero-section nds-sub" aria-label="Page header">\n' +
'    <nav class="nds-breadcrumb-nav" aria-label="Breadcrumb" hidden>\n' +
'      <ol class="nds-breadcrumb">\n' +
'        <li><a href="index.html">Home</a></li>\n' +
'        <li class="nds-truncate" aria-current="page">Page title</li>\n' +
'      </ol>\n' +
'    </nav>\n' +
'    <div class="nds-section-wrapper">\n' +
'      <div class="nds-section-head">\n' +
'        <h1 class="nds-section-title">Page title</h1>\n' +
'        <p class="nds-section-description">One line about the page.</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </section>\n' +
'\n' +
'  <div class="nds-content-layout">\n' +
'    <div class="nds-main-content">\n' +
'\n' +
'      <section id="intro" class="nds-content-section">\n' +
'        <div class="nds-section-wrapper">\n' +
'          <div class="nds-section-head">\n' +
'            <h2 class="nds-section-title">Section title</h2>\n' +
'          </div>\n' +
'          <div class="nds-section-body">\n' +
'            <p>Your content.</p>\n' +
'          </div>\n' +
'        </div>\n' +
'      </section>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'</main>'
    };

    /* --- copy buttons ------------------------------------------------------ */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-copy]');
        if (!btn) return;

        // data-copy is either a key in SNIPPETS, or the literal text to copy.
        // If it is neither, fall back to whatever is in the adjacent <pre>.
        // hasOwnProperty, not a bare lookup: data-copy="constructor" would
        // otherwise resolve to a function off Object.prototype and get copied.
        var key = btn.getAttribute('data-copy');
        var pre = btn.parentNode.querySelector('pre');
        var named = Object.prototype.hasOwnProperty.call(SNIPPETS, key);
        var text = named ? SNIPPETS[key] : (key || (pre && pre.textContent) || '');
        if (!text) return;

        copy(text).then(function (ok) {
            var label = btn.querySelector('.nds-label');
            if (!label) return;
            if (btn.__t) { clearTimeout(btn.__t); btn.__t = null; }
            else { btn.__rest = label.textContent; }
            label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
            btn.setAttribute('data-copied', '');
            btn.__t = setTimeout(function () {
                label.textContent = btn.__rest;
                btn.removeAttribute('data-copied');
                btn.__t = null;
            }, 1600);
        });
    });

    function copy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text)
                .then(function () { return true; }, function () { return legacy(text); });
        }
        return Promise.resolve(legacy(text));
    }

    function legacy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        return ok;
    }

    /* --- table of contents highlighting ------------------------------------ */
    var links = [].slice.call(document.querySelectorAll('.g-toc a[href^="#"]'));
    var steps = links
        .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
        .filter(Boolean);

    if (steps.length && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id);
                });
            });
        }, { rootMargin: '-10% 0px -75% 0px' });
        steps.forEach(function (s) { io.observe(s); });
    }
})();
