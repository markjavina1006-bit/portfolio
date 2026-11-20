/* =========================================================
   script.js
   1. Dark / light theme toggle
   2. Certificate and resume modals (with zoom)
   3. Cursor follower
   4. Navbar background
   5. Scroll reveal and staggered cards
   6. 3D section entrance animations
   7. Menu clicks
   8. Splash screen (entry gate, slide + blur exit)
   9. Cursor aura (fast ambient glow)
   ========================================================= */

/* ---------- 1. THEME TOGGLE ---------- */
(function () {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const KEY = 'portfolio-theme';
  let timer;

  function setTheme(theme, animate) {
    if (animate) {
      root.classList.add('theme-anim');
      clearTimeout(timer);
      timer = setTimeout(() => root.classList.remove('theme-anim'), 600);
    }
    root.setAttribute('data-theme', theme);

    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;

    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  toggle.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });

  setTheme(root.getAttribute('data-theme') || 'light', false);
})();

/* ---------- 2. CERTIFICATE MODAL (with zoom) ---------- */

const ZOOM_MIN = 0.5, ZOOM_MAX = 3, ZOOM_STEP = 0.25;
let certZoom = 1;

/* The first filename found in this folder is shown */
const CERT_FILES = [
  "gcp-cert.png",
  "gcp-cert.jpg.png",
  "Mark Joseph De Torres Javiña.jpg",
  "Mark_Joseph_De_Torres_Javiña.png"
];

const certModal   = document.getElementById('certModal');
const certImg     = document.getElementById('certImg');
const certMissing = document.getElementById('certMissing');

let certRequest = 0;

function syncScrollLock() {
  document.body.classList.toggle('modal-open', !certModal.hidden);
}

function setCertZoom(value) {
  certZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));
  const label = document.getElementById('certZoomLabel');
  if (label) label.textContent = Math.round(certZoom * 100) + '%';
  certImg.style.zoom = certZoom;
}

function findFirstFile(names) {
  return new Promise(resolve => {
    let i = 0;
    const tryNext = () => {
      if (i >= names.length) return resolve(null);
      const name = names[i++];
      const probe = new Image();
      probe.onload = () => resolve(name);
      probe.onerror = tryNext;
      probe.src = encodeURI(name);
    };
    tryNext();
  });
}

async function openCert() {
  const requestId = ++certRequest;

  certImg.hidden = true;
  certImg.removeAttribute('src');
  certMissing.hidden = true;
  setCertZoom(1);

  certModal.hidden = false;
  syncScrollLock();
  certModal.querySelector('.modal-close').focus();

  const name = await findFirstFile(CERT_FILES);
  if (requestId !== certRequest || certModal.hidden) return;

  if (name) {
    certImg.src = encodeURI(name);
    certImg.hidden = false;
  } else {
    certMissing.hidden = false;
  }
}

function closeCert() {
  certRequest++;
  certModal.hidden = true;
  certImg.removeAttribute('src');
  syncScrollLock();
}

/* ----- Buttons and keys ----- */
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-cert]'))  { e.preventDefault(); openCert(); }
  if (e.target.closest('[data-close-cert]')) closeCert();

  // Zoom buttons: data-zoom="in|out|reset"
  const zoomBtn = e.target.closest('[data-zoom]');
  if (zoomBtn) {
    const action = zoomBtn.dataset.zoom;
    if (action === 'in')       setCertZoom(certZoom + ZOOM_STEP);
    else if (action === 'out') setCertZoom(certZoom - ZOOM_STEP);
    else                       setCertZoom(1);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !certModal.hidden) closeCert();
});

/* ---------- 3. CURSOR FOLLOWER (mouse devices only) ---------- */
/* Only runs if #cursorDot and #cursorGlow exist in the HTML (they don't right now). */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const dot  = document.getElementById('cursorDot');
  const glow = document.getElementById('cursorGlow');
  if (!dot || !glow) return;

  let mouseX = 0, mouseY = 0;   // exact pointer position
  let glowX = 0, glowY = 0;     // glow position, eases toward the pointer
  let animating = false;

  // Higher = snappier. 0.75 is fast with almost no trailing lag.
  const FOLLOW = 0.75;

  function tick() {
    glowX += (mouseX - glowX) * FOLLOW;
    glowY += (mouseY - glowY) * FOLLOW;

    dot.style.transform  = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;

    // Keep animating only while the glow is still catching up
    if (Math.abs(mouseX - glowX) > 0.1 || Math.abs(mouseY - glowY) > 0.1) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
    }
  }

  window.addEventListener('pointermove', (e) => {
    if (!document.body.classList.contains('cursor-ready')) {
      // First movement: place the glow on the pointer instead of sliding in from the corner
      glowX = e.clientX;
      glowY = e.clientY;
      document.body.classList.add('cursor-ready');
    }
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }, { passive: true });

  // Grow the dot over links and cards
  const hoverTargets = 'a, button, summary, .card, .acc, .detail-row, .contact-card, .duty, .skill-item, .timeline-item';
  document.addEventListener('pointerover', (e) => {
    dot.classList.toggle('hover', !!e.target.closest(hoverTargets));
  }, { passive: true });
})();

/* ---------- 4. NAVBAR BACKGROUND ---------- */
const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menu-toggle');

function updateNavbar() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

/* ---------- 5. SCROLL REVEAL & STAGGERED CARDS ---------- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const groupObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.skill-grid, .duty-grid, .contact-grid, .timeline, .about-tags').forEach(group => {
  group.classList.add('stagger');
  [...group.children].forEach((child, i) => child.style.setProperty('--i', i));
  groupObserver.observe(group);
});

/* ---------- 6. PER-SECTION TRANSITIONS ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SOFT    = 'cubic-bezier(0.22, 1, 0.36, 1)';    // fast, then settles
const SHUTTER = 'cubic-bezier(0.77, 0, 0.175, 1)';   // sharp start, sharp stop
const ELASTIC = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // fallback bounce
const SHOWN   = { opacity: 1, transform: 'none', filter: 'blur(0px)' };

/* Real spring physics: samples a damped oscillator into a CSS linear() easing.
   zeta = damping (lower = bouncier), w0 = stiffness (higher = faster). */
function springEase(zeta = 0.45, w0 = 14, n = 48) {
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    pts.push(i === n ? 1 : +v.toFixed(4));
  }
  return `linear(${pts.join(',')})`;
}
const SPRING = CSS.supports('animation-timing-function', 'linear(0, 1)') ? springEase() : ELASTIC;

/* Each entry:
   dur / ease : the page-level transition
   newKf/oldKf: how the NEW / OLD page animate (or build(x, y) to compute them from the click)
   items      : staggered entrance of the content inside the section
                (sel = what animates, from = starting look, to = optional extra end values,
                 delay = ms before the first item, gap = ms between items) */
const FX = {
  /* ABOUT: circle expansion from the clicked button + floating content */
  '#about': {
    dur: 900, ease: 'cubic-bezier(0.65, 0, 0.15, 1)',
    build(x, y) {
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      return {
        newKf: [
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          { clipPath: `circle(${r}px at ${x}px ${y}px)` }
        ],
        oldKf: [
          { transform: 'scale(1)',    filter: 'blur(0px)', opacity: 1 },
          { transform: 'scale(0.95)', filter: 'blur(5px)', opacity: 0.6 }
        ]
      };
    },
    items: {
      sel: '.section-head > *, .about-card, .about-tags span',
      from: { opacity: 0, transform: 'translateY(56px)', filter: 'blur(4px)' },
      dur: 1100, delay: 350, gap: 80, ease: SOFT
    }
  },

  /* EMPLOYMENT: horizontal slide with a glass-like blur fade */
  '#employment': {
    dur: 900, ease: SOFT,
    newKf: [
      { opacity: 0, transform: 'translateX(14vw)', filter: 'blur(16px)' },
      { opacity: 1, transform: 'none',             filter: 'blur(0px)' }
    ],
    oldKf: [
      { opacity: 1, transform: 'none',              filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateX(-8vw)',  filter: 'blur(10px)' }
    ],
    items: {
      sel: '.icon-box, .acc-text > *, .acc-toggle, .detail-row, .duty',
      from: { opacity: 0, transform: 'translateX(-90px)', filter: 'blur(14px)' },
      dur: 800, delay: 300, gap: 55, ease: SOFT
    }
  },

  /* EDUCATION: 3D perspective tilt and depth */
  '#education': {
    dur: 1000, ease: SOFT,
    newKf: [
      { opacity: 0, transformOrigin: '50% 0%', transform: 'perspective(1800px) rotateX(22deg) translateZ(-320px) translateY(90px)' },
      { opacity: 1, transformOrigin: '50% 0%', transform: 'perspective(1800px) rotateX(0deg) translateZ(0) translateY(0)' }
    ],
    oldKf: [
      { opacity: 1, transformOrigin: '50% 100%', transform: 'perspective(1800px) rotateX(0deg) translateZ(0)' },
      { opacity: 0, transformOrigin: '50% 100%', transform: 'perspective(1800px) rotateX(-12deg) translateZ(-240px)' }
    ],
    items: {
      sel: '.section-head > *, .acc',
      from: { opacity: 0, transform: 'perspective(900px) rotateX(-65deg) translateY(36px)', filter: 'blur(6px)' },
      dur: 900, delay: 380, gap: 110, ease: SOFT
    }
  },

  /* INTERNSHIP: diagonal curtain wipe, top-left to bottom-right */
  '#internship': {
    dur: 950, ease: SHUTTER,
    newKf: [
      { clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%)',     transform: 'scale(1.06)' },
      { clipPath: 'polygon(0% 0%, 230% 0%, 0% 230%)', transform: 'scale(1)' }
    ],
    oldKf: [
      { opacity: 1,   transform: 'none' },
      { opacity: 0.5, transform: 'scale(0.96)' }
    ],
    items: {
      sel: '.icon-box, .acc-text > *, .acc-toggle, .hours-banner, .detail-row',
      from: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)', transform: 'translateY(-24px)' },
      to:   { clipPath: 'inset(0% 0% 0% 0%)' },
      dur: 750, delay: 420, gap: 70, ease: SOFT
    }
  },

  /* SKILLS: spring-physics drop, tiles pop up one by one */
  '#skills': {
    dur: 1000, ease: SPRING,
    newKf: [
      { opacity: 0, transform: 'translateY(-90px)' },
      { opacity: 1, transform: 'none' }
    ],
    oldKf: [
      { opacity: 1,   transform: 'none' },
      { opacity: 0.6, transform: 'scale(0.96)' }
    ],
    items: {
      sel: '.icon-box, .acc-text > *, .acc-toggle, .acc-lead, .skill-item',
      from: { opacity: 0, transform: 'translateY(70px) scale(0.5)' },
      dur: 1000, delay: 320, gap: 75, ease: SPRING
    }
  },

  /* CONTACT: cinematic soft-focus push-in */
  '#contact': {
    dur: 1100, ease: SOFT,
    newKf: [
      { opacity: 0, transform: 'scale(1.3)',  filter: 'blur(26px)', offset: 0 },
      { opacity: 1, transform: 'scale(1.05)', filter: 'blur(4px)',  offset: 0.6 },
      { opacity: 1, transform: 'none',        filter: 'blur(0px)',  offset: 1 }
    ],
    oldKf: [
      { opacity: 1, transform: 'none',         filter: 'blur(0px)' },
      { opacity: 0, transform: 'scale(0.92)',  filter: 'blur(10px)' }
    ],
    items: {
      sel: '.section-head > *, .contact-card, .social-link',
      from: { opacity: 0, transform: 'scale(0.8)', filter: 'blur(14px)' },
      dur: 900, delay: 450, gap: 85, ease: SOFT
    }
  }
};

/* Fallback for the logo (#home) and any other link: circle reveal from the click */
const DEFAULT_FX = {
  dur: 800, ease: 'cubic-bezier(0.65, 0, 0.15, 1)',
  build(x, y) {
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    return {
      newKf: [
        { clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${r}px at ${x}px ${y}px)` }
      ],
      oldKf: [
        { transform: 'scale(1)',    filter: 'blur(0px)', opacity: 1 },
        { transform: 'scale(0.94)', filter: 'blur(6px)', opacity: 0.6 }
      ]
    };
  },
  items: {
    sel: '.hero-content > *, .hero-gif',
    from: { opacity: 0, transform: 'translateY(32px) scale(0.97)', filter: 'blur(10px)' },
    dur: 800, delay: 280, gap: 60, ease: SOFT
  }
};

/* ----- Cleanup helpers ----- */
let runningFx = [];       // content animations currently playing
let navLocked = false;    // true only while a page transition runs

function cancelRunningFx() {
  runningFx.forEach(a => a.cancel());
  runningFx = [];
}

// Content inside the section animates in one piece after another
function playStagger(target, cfg) {
  if (reduceMotion || !cfg) return;
  const scope = target.matches('details') ? target : (target.closest('section, footer') || target);
  [...scope.querySelectorAll(cfg.sel)].forEach((el, i) => {
    const a = el.animate(
      [cfg.from, { ...SHOWN, ...(cfg.to || {}) }],
      { duration: cfg.dur, delay: cfg.delay + Math.min(i, 14) * cfg.gap, easing: cfg.ease, fill: 'backwards' }
    );
    runningFx.push(a);
    a.finished.then(() => { runningFx = runningFx.filter(x => x !== a); }, () => {});
  });
}

// Marks one scroll-reveal block as shown with NO transition and NO riseIn replay
function snapVisible(el) {
  if (el.classList.contains('visible')) return;
  if (el.classList.contains('stagger')) {
    [...el.children].forEach(c => { c.style.animation = 'none'; });   // blocks the riseIn keyframes
  }
  el.style.transition = 'none';
  el.classList.add('visible');
  void el.offsetHeight;            // flush styles while the transition is off
  el.style.transition = '';        // nothing changes afterwards, so nothing animates
}

// After the jump, reveal everything the observer would otherwise animate a moment later:
// the whole target section plus any block already on screen or above it
function settleReveals(target) {
  const scope = target.closest('section, footer') || target;
  document.querySelectorAll('.reveal:not(.visible), .stagger:not(.visible)').forEach(el => {
    if (scope.contains(el) || el.getBoundingClientRect().top < innerHeight) snapVisible(el);
  });
}

function goToSection(target, id, origin) {
  if (navLocked) return;                       // ignore clicks until the transition ends

  const fx = FX[id] || DEFAULT_FX;
  const root = document.documentElement;
  cancelRunningFx();                           // stop leftovers from the previous section

  const update = () => {
    if (target.tagName === 'DETAILS') target.open = true;          // Employment, Internship, Skills
    if (id === '#education') {
      const d = target.querySelector('details');
      if (d) d.open = true;
    }
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    settleReveals(target);                     // after the scroll, so positions are final
    if (menuToggle) menuToggle.checked = false;
  };

  // Reduced motion or no View Transitions: jump (with the stagger if motion is allowed)
  if (reduceMotion || !document.startViewTransition) {
    update();
    playStagger(target, fx.items);
    return;
  }

  navLocked = true;
  let unlockTimer = 0;
  const unlock = () => { navLocked = false; clearTimeout(unlockTimer); };
  unlockTimer = setTimeout(unlock, fx.dur + 800);   // safety net

  const t = document.startViewTransition(update);
  t.finished.then(unlock, unlock);

  t.ready.then(() => {
    const kf = fx.build ? fx.build(origin.x, origin.y) : fx;

    root.animate(kf.newKf, {
      duration: fx.dur, easing: fx.ease, pseudoElement: '::view-transition-new(root)'
    });
    root.animate(kf.oldKf, {
      duration: fx.dur, easing: fx.ease, fill: 'forwards', pseudoElement: '::view-transition-old(root)'
    });

    playStagger(target, fx.items);
  }).catch(unlock);
}

/* ---------- 7. MENU CLICKS ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length < 2) return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();

    // Used by the circle reveals (the center of the clicked link)
    const r = link.getBoundingClientRect();
    goToSection(target, id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });
});

/* ---------- 7b. ACCORDION OPEN ANIMATION (real clicks only) ---------- */
document.querySelectorAll('.acc').forEach(d => {
  const summary = d.querySelector('.acc-summary');
  if (summary) summary.addEventListener('click', () => { if (!d.open) d.classList.add('acc-anim'); });
  d.addEventListener('animationend', e => { if (e.animationName === 'expandIn') d.classList.remove('acc-anim'); });
  d.addEventListener('toggle', () => { if (!d.open) d.classList.remove('acc-anim'); });
});
/* Hide the "could not be loaded" message inside the certificate modal */
document.querySelectorAll('#certModal .modal-missing, #certModal p, #certModal code, #certModal .fa-file-circle-exclamation')
  .forEach(el => el.style.display = 'none');

/* ---------- 8. SPLASH SCREEN (entry gate, fully isolated) ---------- */
(function () {
  const splash   = document.getElementById('splash');
  const enterBtn = document.getElementById('splashEnter');
  const center   = document.getElementById('splashCenter');
  const title    = document.getElementById('splashTitle');
  const wrap     = document.getElementById('splashWrap');
  if (!splash || !enterBtn || !center || !title || !wrap) return;

  const SHOW_ONCE_PER_VISIT = true;   // false = show the splash on every page load
  const STORAGE_KEY = 'portfolio-splash-seen';

  let alreadySeen = false;
  try {
    alreadySeen = SHOW_ONCE_PER_VISIT && sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch (e) {}
  if (alreadySeen) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover       = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const useEffects     = canHover && !prefersReduced;

  let running = false;
  let leaving = false;
  let rafId = 0;
  let firstMove = true;

  const cur = { x: 0, y: 0 };                 // smoothed pointer position inside the overlay
  const tgt = { x: 0, y: 0 };                 // real pointer position
  const btn = { x: 0, y: 0, tx: 0, ty: 0 };   // magnetic offset of the ENTER button

  /* ----- One animation loop: spotlight, tilt, and magnetic button ----- */
  function frame() {
    rafId = 0;
    if (!running) return;

    cur.x += (tgt.x - cur.x) * 0.14;
    cur.y += (tgt.y - cur.y) * 0.14;
    btn.x += (btn.tx - btn.x) * 0.2;
    btn.y += (btn.ty - btn.y) * 0.2;

    // Spotlight centre (used by the CSS gradients)
    splash.style.setProperty('--sx', cur.x.toFixed(1) + 'px');
    splash.style.setProperty('--sy', cur.y.toFixed(1) + 'px');

    // Magnetic ENTER button
    enterBtn.style.translate = btn.x.toFixed(2) + 'px ' + btn.y.toFixed(2) + 'px';

    // Gentle 3D tilt of the centre block
    const nx = cur.x / Math.max(1, splash.clientWidth) - 0.5;    // -0.5 to 0.5
    const ny = cur.y / Math.max(1, splash.clientHeight) - 0.5;
        center.style.transform =
      'rotateX(' + (-ny * 8).toFixed(2) + 'deg) rotateY(' + (nx * 10).toFixed(2) + 'deg) ' +
      'translate3d(' + (nx * 16).toFixed(2) + 'px,' + (ny * 10).toFixed(2) + 'px,0)';

    // Extrusion walls swing opposite to the cursor (same idea as the hero)
    let ex = 0.5 - nx * 1.8;
    let ey = 0.8 - ny * 1.4;
    const len = Math.hypot(ex, ey);
    if (len > 1) { ex /= len; ey /= len; }
    center.style.setProperty('--tex', ex.toFixed(3));
    center.style.setProperty('--tey', ey.toFixed(3));

    const moving =
      Math.abs(tgt.x - cur.x) > 0.1 || Math.abs(tgt.y - cur.y) > 0.1 ||
      Math.abs(btn.tx - btn.x) > 0.05 || Math.abs(btn.ty - btn.y) > 0.05;
    if (moving) rafId = requestAnimationFrame(frame);
  }

  function kick() {
    if (running && !rafId) rafId = requestAnimationFrame(frame);
  }

  /* ----- Mouse handlers ----- */
  function onPointerMove(e) {
    const rect = splash.getBoundingClientRect();
    tgt.x = e.clientX - rect.left;
    tgt.y = e.clientY - rect.top;

    if (firstMove) {                       // start the spotlight right where the mouse is
      cur.x = tgt.x;
      cur.y = tgt.y;
      firstMove = false;
      splash.classList.add('has-pointer');
    }

    // Pull the ENTER button gently toward the cursor when it is close
    const r = wrap.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy);
    const RANGE = 140;     // px: how close the cursor must be
    const PULL  = 14;      // px: the strongest pull
    if (dist > 0 && dist < RANGE) {
      const strength = (1 - dist / RANGE) * PULL;
      btn.tx = (dx / dist) * strength;
      btn.ty = (dy / dist) * strength;
    } else {
      btn.tx = 0;
      btn.ty = 0;
    }
    kick();
  }

  function onPointerLeave() {
    tgt.x = splash.clientWidth / 2;      // send the spotlight back to the centre
    tgt.y = splash.clientHeight / 2;
    btn.tx = 0;
    btn.ty = 0;
    splash.classList.remove('has-pointer');
    firstMove = true;
    kick();
  }

  /* ----- Show the splash (the title reveal runs from CSS) ----- */
  function start() {
    splash.hidden = false;
    splash.classList.add('splash-go');
    document.documentElement.classList.add('splash-active');
    document.body.classList.add('splash-active');
    running = true;

    enterBtn.focus({ preventScroll: true });
    // Once the title reveal has finished, drop the mask so the walls can show
    const settle = () => splash.classList.add('splash-settled');
    const lastWord = title.querySelector('.splash-word:nth-child(3) .splash-word-inner');
    if (prefersReduced || !lastWord) {
      settle();
    } else {
      lastWord.addEventListener('animationend', settle, { once: true });
      setTimeout(settle, 1800);             // safety net
    }
    if (useEffects) {
      splash.addEventListener('pointermove', onPointerMove, { passive: true });
      splash.addEventListener('pointerleave', onPointerLeave);
    }
  }

  /* ----- Exit: smooth slide + blur ----- */
  // Monochrome shutter wipe with depth:
  //   1. The splash content pushes forward in 3D and blurs out.
  //   2. A razor-sharp sheet (black in Light Mode, white in Dark Mode) sweeps across the screen.
  //   3. Once the screen is covered, the splash is removed underneath.
  //   4. The sheet keeps sweeping off to the right, while the navbar and hero glide in.
  // Only transform, opacity and a light blur are animated, so it stays on the GPU.
  // Everything runs from this script, so no extra CSS is needed.
  const COVER_MS  = 450;                                  // sheet sweeps in (ms)
  const OPEN_MS   = 550;                                  // sheet sweeps out (ms)
  const WIPE_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';     // sharp start, sharp stop
  const SOFT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';     // fast, then settles gently

  function enter() {
    if (leaving) return;                             // ignores rapid repeat clicks
    leaving = true;
    running = false;                                 // stops the animation loop
    splash.removeEventListener('pointermove', onPointerMove);
    splash.removeEventListener('pointerleave', onPointerLeave);

    enterBtn.blur();
    splash.style.pointerEvents = 'none';

    // Clear the inline tilt/magnet styles
    center.style.transform = '';
    enterBtn.style.translate = '';

    // Removes the splash, restores scrolling and lands on the hero
    function finish() {
      splash.classList.remove('is-leaving', 'is-exiting', 'splash-go', 'has-pointer', 'splash-settled');
      splash.getAnimations({ subtree: true }).forEach(a => a.cancel());
      splash.hidden = true;                          // display: none
      splash.style.pointerEvents = '';
      splash.style.opacity = '';
      splash.style.transition = '';
      splash.classList.remove('is-leaving', 'is-exiting', 'splash-go', 'has-pointer');
      document.documentElement.classList.remove('splash-active', 'page-entering');
      document.body.classList.remove('splash-active');   // scrolling restored
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      leaving = false;
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    }

    if (prefersReduced) {
      // Motion turned off: quick plain fade, no slide or blur
      splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'linear', fill: 'forwards' });
      setTimeout(finish, 170);
      return;
    }

    const dark = document.documentElement.getAttribute('data-theme') === 'dark';

    // The sheet that wipes across the screen
    const sheet = document.createElement('div');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.style.cssText =
      'position:fixed;inset:0;z-index:1100;pointer-events:none;will-change:transform;' +
      'transform-origin:left center;transform:scaleX(0);' +
      'background:' + (dark ? '#ffffff' : '#000000') + ';' +
      'box-shadow:' + (dark ? '0 0 60px rgba(255,255,255,0.6)' : '0 0 50px rgba(0,0,0,0.4)') + ';';
    document.body.appendChild(sheet);

    // 1. The splash content pushes forward in 3D and blurs out
    center.animate(
      [
        { opacity: 1, filter: 'blur(0px)', transform: 'translateZ(0) scale(1)' },
        { opacity: 0, filter: 'blur(8px)', transform: 'translateZ(160px) scale(1.12)' }
      ],
      { duration: COVER_MS, easing: SOFT_EASE, fill: 'forwards' }
    );

    // 2. The sheet sweeps in from the left and covers the screen
    const closing = sheet.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: COVER_MS, easing: WIPE_EASE, fill: 'forwards' }
    );

    closing.onfinish = function () {
      // 3. Screen fully covered: remove the splash underneath
      finish();

      // 4a. The navbar and hero glide into place from the right
      ['.navbar', '.hero'].forEach(function (selector) {
        const el = document.querySelector(selector);
        if (!el || !el.animate) return;
        el.animate(
          [
            { opacity: 0, filter: 'blur(6px)', transform: 'translate3d(40px, 0, 0) scale(0.97)' },
            { opacity: 1, filter: 'blur(0px)', transform: 'translate3d(0, 0, 0) scale(1)' }
          ],
          { duration: OPEN_MS + 150, easing: SOFT_EASE }
        );
      });

      // 4b. The sheet keeps going and sweeps off to the right
      sheet.style.transformOrigin = 'right center';
      sheet.style.transform = 'scaleX(1)';
      closing.cancel();
      const opening = sheet.animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
        { duration: OPEN_MS, easing: WIPE_EASE, fill: 'forwards' }
      );
      opening.onfinish = function () { sheet.remove(); };
    };
  }

  /* ----- Theme toggle on the splash (stays in sync with the navbar toggle) ----- */
  const splashTheme = document.getElementById('splashThemeToggle');
  const mainTheme   = document.getElementById('themeToggle');
  if (splashTheme && mainTheme) {
    function syncSplashThemeLabel() {
      const dark  = document.documentElement.getAttribute('data-theme') === 'dark';
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      splashTheme.setAttribute('aria-label', label);
      splashTheme.title = label;
    }

    // Clicking the splash button simply "presses" the navbar toggle, so the theme,
    // localStorage and the colour fade all use the one existing code path (section 1).
    splashTheme.addEventListener('click', () => mainTheme.click());

    // Whenever the theme changes from anywhere, refresh the splash button label
    new MutationObserver(syncSplashThemeLabel)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    syncSplashThemeLabel();
  }

  enterBtn.addEventListener('click', enter);

  // Escape also enters, so keyboard users are never stuck
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !splash.hidden) enter();
  });

  start();
})();

/* ---------- 9. CURSOR AURA (ambient glow that follows the mouse) ---------- */
(function () {
  const aura = document.getElementById('cursorAura');
  if (!aura) return;

  // Touchscreens: remove it completely
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    aura.remove();
    return;
  }

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FOLLOW = calm ? 1 : 0.45;      // higher = snappier (0.35 to 0.5 feels near-instant)
  let mx = 0, my = 0;                  // real pointer position
  let ax = 0, ay = 0;                  // glow position (eases toward the pointer)
  let rafId = 0;
  let seen = false;

  function tick() {
    rafId = 0;
    ax += (mx - ax) * FOLLOW;
    ay += (my - ay) * FOLLOW;
    aura.style.transform =
      'translate3d(' + ax.toFixed(1) + 'px,' + ay.toFixed(1) + 'px,0) translate(-50%,-50%)';

    // Keep looping only while the glow is still catching up
    if (Math.abs(mx - ax) > 0.1 || Math.abs(my - ay) > 0.1) {
      rafId = requestAnimationFrame(tick);
    }
  }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mx = e.clientX;
    my = e.clientY;

    if (!seen) {                       // first move: start on the pointer, no sliding in
      seen = true;
      ax = mx;
      ay = my;
    }
    aura.classList.add('is-on');
    if (!rafId) rafId = requestAnimationFrame(tick);
  }, { passive: true });

  // Fade out when the mouse leaves the window
  document.documentElement.addEventListener('mouseleave', () => aura.classList.remove('is-on'));
  window.addEventListener('blur', () => aura.classList.remove('is-on'));
})();

/* ---------- 10. HERO EXTRUSION LABELS (static, no mouse tracking) ---------- */
(function () {
  const hero = document.getElementById('home');
  if (!hero) return;

  // Same conditions as before, so the page looks the same at rest
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Marks the elements that get the solid wall look from style.css (section 28)
  [
    ['.hero-badge',      'badge'],
    ['.hero-content h1', 'text'],
    ['.hero-title',      'sub'],
    ['.hero-ctas .btn',  'pill']
  ].forEach(([selector, type]) => {
    hero.querySelectorAll(selector).forEach(el => { el.dataset.extrude = type; });
  });
})();

/* ---------- 11. SPLASH HEX GRID (3D tilt + parallax) ---------- */
(function () {
  const splash = document.getElementById('splash');
  if (!splash || splash.hidden) return;          // splash already seen this visit

  // Build the layers: shadow edges, highlight edges, cursor glow
  const hex = document.createElement('div');
  hex.className = 'splash-hex';
  hex.setAttribute('aria-hidden', 'true');
  ['hx-dark', 'hx-light', 'hx-glow'].forEach(cls => {
    const s = document.createElement('span');
    s.className = 'hx ' + cls;
    hex.appendChild(s);
  });
  splash.insertBefore(hex, splash.firstChild);   // behind everything else

  // Mouse devices only, and only if motion is allowed (otherwise the grid stays still)
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ----- Tuning ----- */
  const TILT  = { x: 7, y: 5 };      // degrees of 3D lean (rotateY, rotateX)
  const SHIFT = { x: 26, y: 18 };    // px the grid drifts against the cursor
  const EASE  = 0.08;                // lower = softer, slower follow

  let tx = 0, ty = 0;                // target, -1 to 1
  let cx = 0, cy = 0;                // current (eases toward the target)
  let mx = 0, my = 0;                // cursor position inside the grid (for the glow)
  let gx = 0, gy = 0;                // smoothed glow position
  let first = true;
  let raf = 0;

  function frame() {
    raf = 0;

    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    gx += (mx - gx) * 0.25;
    gy += (my - gy) * 0.25;

    hex.style.transform =
      'translate3d(' + (-cx * SHIFT.x).toFixed(2) + 'px,' + (-cy * SHIFT.y).toFixed(2) + 'px,0) ' +
      'rotateX(' + (-cy * TILT.y).toFixed(3) + 'deg) ' +
      'rotateY(' + (cx * TILT.x).toFixed(3) + 'deg)';
    hex.style.setProperty('--hx', gx.toFixed(1) + 'px');
    hex.style.setProperty('--hy', gy.toFixed(1) + 'px');

    const busy =
      Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ||
      Math.abs(mx - gx) > 0.3   || Math.abs(my - gy) > 0.3;
    if (busy && !splash.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  splash.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;

    tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;

    // The grid is larger than the screen, so convert to its own coordinates
    mx = e.clientX - hex.offsetLeft;
    my = e.clientY - hex.offsetTop;
    if (first) { gx = mx; gy = my; first = false; }   // glow starts under the cursor

    kick();
  }, { passive: true });

  // Mouse leaves: the grid eases back to flat
  splash.addEventListener('pointerleave', () => {
    tx = 0; ty = 0;
    first = true;
    kick();
  });
})();

/* ---------- 12. LOGO VIDEO TRANSITION (MJ / Mark Javiña to Home) ---------- */
(function () {
  const overlay = document.getElementById('videoTransition');
  const video   = document.getElementById('transitionVideo');
  if (!overlay || !video) return;

  const FADE_OUT_MS = 700;    // must match the closing fade in style.css
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let busy  = false;          // true while the overlay is up
  let done  = false;          // makes sure we only jump once per click
  let timer = 0;

  // Autoplay rules, and preload now so the first click has no lag
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.load();

  // The clip ended (or was skipped): jump home under the cover, then fade the overlay out
  function finish() {
    if (!busy || done) return;
    done = true;
    clearTimeout(timer);
    video.removeEventListener('ended', finish);
    document.documentElement.classList.remove('video-lock');

    const home = document.getElementById('home');
    if (typeof cancelRunningFx === 'function') cancelRunningFx();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (home && typeof settleReveals === 'function') settleReveals(home);
    if (typeof menuToggle !== 'undefined' && menuToggle) menuToggle.checked = false;   // closes the mobile menu

    overlay.classList.remove('is-on');                                  // graceful fade-out

    // The hero content glides in while the overlay fades away
    if (home && typeof playStagger === 'function' && typeof DEFAULT_FX !== 'undefined') {
      playStagger(home, DEFAULT_FX.items);
    }

    // Reset after the fade so the next click starts clean
    setTimeout(() => {
      video.pause();
      try { video.currentTime = 0; } catch (err) {}
      busy = false;
    }, FADE_OUT_MS);
  }

  // Capture phase: runs before your existing menu-click code
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href="#home"]');                  // the MJ / Mark Javiña logo
    if (!link) return;

    // Reduced motion, or the video file is missing: use the normal jump
    if (calm || video.error) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if (busy) return;                                                   // ignore repeat clicks

    busy = true;
    done = false;

    overlay.classList.add('is-on');                                     // smooth fade-in with the zoom
    document.documentElement.classList.add('video-lock');

    try { video.currentTime = 0; } catch (err) {}
    const p = video.play();
    if (p && p.catch) p.catch(() => {});                                // if playback is blocked, the timer still runs

    video.addEventListener('ended', finish);

    // Safety net: the clip length plus a little extra
    const len = (isFinite(video.duration) && video.duration > 0) ? video.duration * 1000 : 2000;
    timer = setTimeout(finish, len + 700);
  }, true);

  // Clicking the video or pressing Escape skips ahead
  overlay.addEventListener('click', finish);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && busy) finish();
  });
})();

/* ---------- 13. HERO CARD: BACK FACE + CLICK / DRAG TO SPIN ---------- */
(function () {
  const frame = document.querySelector('.hero-gif-frame');
  if (!frame) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // The card wrapper built by section 10 (it is missing on touch devices, so make one)
  let host = frame.closest('.x3d--card');
  if (!host) {
    host = document.createElement('span');
    host.className = 'x3d x3d--card';
    frame.parentNode.insertBefore(host, frame);
    host.appendChild(frame);
  }

  /* ----- Back face ----- */
  const BACK_SRC = '';                 // leave empty to reuse the front GIF, or set another file, e.g. 'back.gif'
  const frontImg = frame.querySelector('img');
  if (frontImg && !host.querySelector('.card-back')) {
    const back = document.createElement('span');
    back.className = 'card-back';
    back.setAttribute('aria-hidden', 'true');

    const img = frontImg.cloneNode(false);   // copies src, size and draggable settings
    img.removeAttribute('id');
    img.alt = '';
    if (BACK_SRC) img.src = BACK_SRC;

    back.appendChild(img);
    host.appendChild(back);
  }

  /* ----- Tuning ----- */
  const CLICK_SPEED = 1000;     // deg/s given by one click (about 1.5 turns)
  const DRAG_RATIO  = 0.6;      // degrees turned per pixel dragged
  const MAX_SPEED   = 2500;     // deg/s cap for a hard flick
  const FRICTION    = 2.2;      // higher = stops sooner
  const SETTLE_K    = 120;      // spring stiffness back to front-facing
  const SETTLE_D    = 22;       // spring damping (about 2 x sqrt(K) = no wobble)

  let angle = 0, vel = 0;
  let dragging = false, moved = 0;
  let lastX = 0, lastT = 0;
  let raf = 0, last = 0;

  function paint() {
    host.style.rotate = '0 1 0 ' + angle.toFixed(2) + 'deg';
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!dragging) {
      if (Math.abs(vel) > 90) {
        vel *= Math.exp(-FRICTION * dt);
        angle += vel * dt;
      } else {
        const target = Math.round(angle / 360) * 360;      // nearest front-facing angle
        vel += (-SETTLE_K * (angle - target) - SETTLE_D * vel) * dt;
        angle += vel * dt;

        if (Math.abs(vel) < 1 && Math.abs(angle - target) < 0.2) {
          angle = 0; vel = 0;
          host.style.rotate = '';
          raf = 0;
          return;
        }
      }
    }
    paint();
    raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  host.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;   // left button only
    dragging = true;
    moved = 0;
    vel = 0;
    lastX = e.clientX;
    lastT = performance.now();
    host.setPointerCapture(e.pointerId);
    kick();
  });

  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max((now - lastT) / 1000, 0.001);

    angle += dx * DRAG_RATIO;
    vel = vel * 0.6 + ((dx * DRAG_RATIO) / dt) * 0.4;
    moved += Math.abs(dx);
    lastX = e.clientX;
    lastT = now;
  });

  function release(e) {
    if (!dragging) return;
    dragging = false;
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);

    if (moved < 5) {
      // A click, not a drag: push the side you clicked
      const r = host.getBoundingClientRect();
      const dir = e.clientX > r.left + r.width / 2 ? 1 : -1;
      vel = dir * CLICK_SPEED;
    } else if (performance.now() - lastT > 80) {
      vel = 0;
    } else {
      vel = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, vel));
    }
    kick();
  }

  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);
})();

