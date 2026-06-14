/* Age gate: on entering the platform pages, ask the visitor to confirm they
   are 18 or older. Remembers the choice so it won't ask again. */
(function () {
    var KEY = 'vault_age_verified';
    try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { /* storage blocked */ }

    var css =
        '.agegate-wrap{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);' +
        '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;' +
        'align-items:center;justify-content:center;padding:24px;' +
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;}" +
        '.agegate-card{width:100%;max-width:360px;background:#161616;border:1px solid #2a2a2a;' +
        'border-radius:20px;padding:28px 24px;text-align:center;color:#fff;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.6);}' +
        '.agegate-badge{width:64px;height:64px;border-radius:18px;margin:0 auto 16px;' +
        'background:linear-gradient(135deg,#7C5CFF,#FF4D8D);display:flex;align-items:center;' +
        'justify-content:center;font-size:2rem;}' +
        '.agegate-card h2{font-size:1.3rem;font-weight:800;margin:0 0 8px;}' +
        '.agegate-card p{font-size:0.86rem;color:#9a9a9a;margin:0 0 20px;line-height:1.5;}' +
        '.agegate-btns{display:flex;flex-direction:column;gap:10px;}' +
        '.agegate-yes{background:linear-gradient(135deg,#FF4D8D,#7C5CFF);color:#fff;border:none;' +
        'padding:14px;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;}' +
        '.agegate-no{background:transparent;color:#9a9a9a;border:1px solid #2a2a2a;padding:13px;' +
        'border-radius:12px;font-size:0.95rem;font-weight:600;cursor:pointer;}' +
        '.agegate-legal{margin:16px 0 0;font-size:0.68rem;color:#6e6e6e;line-height:1.5;}';

    var html =
        '<div class="agegate-card" role="dialog" aria-modal="true" aria-label="Age verification">' +
        '<div class="agegate-badge">🔞</div>' +
        '<h2>Are you 18 or older?</h2>' +
        '<p>This site contains restricted (18+) content. You must be of legal age to enter.</p>' +
        '<div class="agegate-btns">' +
        '<button class="agegate-yes" data-act="yes">Yes, I’m 18 or older — Enter</button>' +
        '<button class="agegate-no" data-act="no">No, take me out</button>' +
        '</div>' +
        '<p class="agegate-legal">By entering you confirm you are at least 18 years old and ' +
        'agree to view encrypted adult content.</p>' +
        '</div>';

    var style = document.createElement('style');
    style.textContent = css;

    var wrap = document.createElement('div');
    wrap.className = 'agegate-wrap';
    wrap.innerHTML = html;

    wrap.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-act]') : null;
        if (!btn) return;
        if (btn.getAttribute('data-act') === 'yes') {
            try { localStorage.setItem(KEY, '1'); } catch (e2) { /* ignore */ }
            wrap.remove();
            document.body.style.overflow = '';
        } else {
            // Underage / declined: leave the site.
            window.location.replace('https://www.google.com');
        }
    });

    function show() {
        document.head.appendChild(style);
        document.body.appendChild(wrap);
        document.body.style.overflow = 'hidden';
    }
    if (document.body) { show(); }
    else { document.addEventListener('DOMContentLoaded', show); }
})();
