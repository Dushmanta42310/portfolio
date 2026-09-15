/**
 * Dushmanta Das - Portfolio Interactive Logic
 * Theme Switcher, Mobile Navigation, Contact Form & Smooth UX
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Interactive Intro Loader: particles, cursor glow, terminal typing, hopping dot
  (function initIntroLoader() {
    const loader = document.getElementById('loader-screen');
    if (!loader) return;

    const bar = document.getElementById('loader-progress-bar');
    const skipBtn = document.getElementById('loader-skip');
    const hopper = document.getElementById('loader-hopper');
    const wordEl = document.getElementById('loader-word');
    const logoEl = document.getElementById('loader-logo');
    const periodEl = document.getElementById('dev-dot');
    const canvas = document.getElementById('loader-particles');
    const cursorGlow = document.getElementById('loader-cursor-glow');
    const clickRings = document.getElementById('loader-click-rings');
    const percentEl = document.getElementById('loader-percent');
    const terminalText = document.getElementById('terminal-text');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = reducedMotion ? 1500 : 5800; // total intro length before auto-dismiss
    const HOP_START = 2400; // begin hopping after letters settle
    const HOP_DURATION = 2900;
    const hopSegs = [
      { t0: 0.00, t1: 0.46, amp: 72 },
      { t0: 0.46, t1: 0.74, amp: 54 },
      { t0: 0.74, t1: 1.00, amp: 168 }
    ];
    const start = performance.now();

    let done = false;
    let rafId = 0;
    let hopRaf = 0;
    let removeTimer = 0;

    document.body.classList.add('loader-active');

    // ============ A) Mouse-reactive particle field ============
    const ctx = canvas ? canvas.getContext('2d') : null;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let prevMouse = { x: -9999, y: -9999 };
    let flowX = 0;
    let flowY = 0; // smoothed cursor velocity, drives the interactive follow
    const PARTICLE_COUNT = 700;

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawnParticles() {
      if (!canvas) return;
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x: x,
          y: y,
          homeX: x,
          homeY: y,
          vx: 0,
          vy: 0,
          r: Math.random() * 2 + 0.6,
          baseR: 0,
          hue: Math.random() < 0.6 ? 199 : 262,
          pulse: Math.random() * Math.PI * 2,
          active: true
        });
      }
    }

    function drawParticles() {
      if (!ctx || !canvas || done) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;

      // Smoothed cursor speed -> a 0..1 "intensity" factor (0 = still, 1 = fast flick)
      const rawVX = mouse.x - prevMouse.x;
      const rawVY = mouse.y - prevMouse.y;
      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;

      flowX += (rawVX - flowX) * 0.12;
      flowY += (rawVY - flowY) * 0.12;
      const flowMag = Math.min(1, Math.hypot(flowX, flowY) / 24);

      // Spatial grid keeps line-linking fast (avoids O(n^2) lag)
      const LINK_DIST = 110;
      const CELL = LINK_DIST;
      const grid = new Map();
      const cellKey = (cx, cy) => cx + ',' + cy;
      for (const p of particles) {
        const key = cellKey(Math.floor(p.x / CELL), Math.floor(p.y / CELL));
        let bucket = grid.get(key);
        if (!bucket) { bucket = []; grid.set(key, bucket); }
        bucket.push(p);
      }

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const influence = 250;

        if (dist < influence && dist > 0.01) {
          // EXACT original follow force — just scaled by cursor speed:
          // still cursor = gentle, fast cursor = dots chase faster.
          const pull = (1 - dist / influence) * (0.3 + flowMag * 0.42);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        // Original home spring, damping raised for a smoother, softer glide
        p.vx += (p.homeX - p.x) * 0.02;
        p.vy += (p.homeY - p.y) * 0.02;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.94;
        p.vy *= 0.94;

        // Wrap around edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        // Pulsing brightness
        p.pulse += 0.03;
        const alpha = 0.3 + Math.sin(p.pulse) * 0.2 + 0.15;

        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ', 90%, 65%, ' + Math.max(0.05, alpha) + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles with faint lines (constellation feel)
        const cx = Math.floor(p.x / CELL);
        const cy = Math.floor(p.y / CELL);
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          for (let gy = cy - 1; gy <= cy + 1; gy++) {
            const bucket = grid.get(cellKey(gx, gy));
            if (!bucket) continue;
            for (const q of bucket) {
              if (q === p) continue;
              const qdx = p.x - q.x;
              const qdy = p.y - q.y;
              const qdist = qdx * qdx + qdy * qdy;
              if (qdist < LINK_DIST * LINK_DIST) {
                const a = (1 - Math.sqrt(qdist) / LINK_DIST) * 0.08;
                ctx.strokeStyle = 'hsla(199, 90%, 65%, ' + a + ')';
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.stroke();
              }
            }
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }

    // ============ B) Cursor glow orb (smooth lerp follow) ============
    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;

    function tickCursorGlow() {
      if (!cursorGlow || done) return;
      glowX += (targetX - glowX) * 0.16;
      glowY += (targetY - glowY) * 0.16;
      cursorGlow.style.transform =
        'translate(' + (glowX - 40).toFixed(1) + 'px,' + (glowY - 40).toFixed(1) + 'px)';
      requestAnimationFrame(tickCursorGlow);
    }

    // ============ C) Click ripple rings ============
    function spawnClickRing(clientX, clientY) {
      if (!clickRings) return;
      const ring = document.createElement('span');
      ring.className = 'loader-click-ring';
      ring.style.left = clientX + 'px';
      ring.style.top = clientY + 'px';
      clickRings.appendChild(ring);
      setTimeout(() => { ring.parentNode && ring.parentNode.removeChild(ring); }, 750);
    }

    // ============ D) Terminal typing sequence ============
    const terminalLines = [
      '$ loading portfolio ...',
      '$ init DBA modules ........',
      '$ mount FLASK core ........',
      '$ embed AI/ML models ......',
      '$ start RAG engine ........',
      'dushmanta.dev READY'
    ];

    function runTerminal() {
      if (!terminalText) return;
      const wrap = document.getElementById('loader-terminal');
      let lineIdx = 0;
      let chIdx = 0;

      function typeLine() {
        const line = terminalLines[lineIdx];
        if (chIdx <= line.length) {
          terminalText.innerHTML = line.slice(0, chIdx === 0 ? 0 : chIdx);
          chIdx++;
          setTimeout(typeLine, 26);
        } else {
          lineIdx++;
          chIdx = 0;
          if (lineIdx < terminalLines.length) {
            setTimeout(typeLine, 160);
          } else if (wrap) {
            wrap.classList.add('is-typed');
          }
        }
      }
      typeLine();
    }

    // ============ E) Hopping dot (left edge -> onto the ".") ============
    // Use the real glyph box of the period, not the tall letter container,
    // so the ball visually lands ON the dot (no misalignment / no flash).
    function glyphCenter(el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const boxes = range.getClientRects();
      if (boxes && boxes.length) {
        const last = boxes[boxes.length - 1];
        return { x: last.left + last.width / 2, y: last.top + last.height / 2 };
      }
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }

    // Soft "settle" easing used only for the final drop onto the dot.
    function easeOutBounce(x) {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (x < 1 / d1) return n1 * x * x;
      if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
      if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }

    const easeInQuad = (x) => x * x;

    const dotStyle = hopper ? hopper.style : null;
    const DOT = { size: 18 };
    let trailEl = null;

    // Trail clone that shimmers behind the hopping dot
    function makeTrail() {
      if (!hopper || trailEl) return;
      trailEl = document.createElement('div');
      trailEl.className = 'loader-hopper-trail';
      loader.appendChild(trailEl);
    }

    function runHops() {
      if (!hopper || !wordEl || !logoEl || !periodEl) return;

      const logoRect = logoEl.getBoundingClientRect();
      const firstLtr = wordEl.querySelector('.ltr');
      const firstRect = firstLtr ? firstLtr.getBoundingClientRect() : logoRect;
      const periodCenter = glyphCenter(periodEl);

      const startX = firstRect.left - logoRect.left + firstRect.width / 2;
      const endX   = periodCenter.x - logoRect.left;
      const landY  = periodCenter.y - logoRect.top - hopper.offsetHeight * 0.42; // rest ON the dot

      DOT.size = hopper.offsetWidth;
      makeTrail();

      // Gentle fade-in (no pop).
      dotStyle.transition = 'opacity 0.25s ease';
      dotStyle.opacity = '1';

      // Two relaxed lead hops, then one higher leap that drops onto the dot with a bounce.
      const hops = hopSegs;

      const hopStart = performance.now();
      let lastX = startX, lastY = landY;

      function frame(now) {
        const t = Math.min(1, (now - hopStart) / HOP_DURATION);

        const x = startX + (endX - startX) * t;
        let y = landY;
        const lastHop = hops[hops.length - 1];

        if (t < lastHop.t1) {
          if (t <= hops[1].t1) {
            // Lead hops: simple smooth arcs above the landing level.
            for (let i = 0; i < hops.length - 1; i++) {
              if (t >= hops[i].t0 && t <= hops[i].t1) {
                const s = (t - hops[i].t0) / (hops[i].t1 - hops[i].t0);
                y = landY - hops[i].amp * Math.sin(Math.PI * s);
              }
            }
          } else {
            // Final leap: rise smoothly, then fall onto the dot with a soft Pixar bounce.
            const seg = (t - lastHop.t0) / (lastHop.t1 - lastHop.t0);
            const lift = 0.26;
            let h;
            if (seg < lift) h = lastHop.amp * easeInQuad(seg / lift);
            else h = lastHop.amp * (1 - easeOutBounce((seg - lift) / (1 - lift)));
            y = landY - h;
          }
        }

        // Draw trail: ghost circles at the previous position
        if (trailEl) {
          trailEl.style.left = (logoRect.left + lastX - DOT.size / 2) + 'px';
          trailEl.style.top = (logoRect.top + lastY - DOT.size / 2) + 'px';
          trailEl.style.width = DOT.size + 'px';
          trailEl.style.height = DOT.size + 'px';
          trailEl.style.opacity = '0.35';
          setTimeout(() => { if (trailEl) trailEl.style.opacity = '0'; }, 60);
        }
        lastX = x;
        lastY = y;

        const vy = y - lastY;
        const squash = Math.max(-0.16, Math.min(0.16, vy * 0.03));
        if (dotStyle) {
          dotStyle.transform =
            'translate(' + (x - DOT.size / 2).toFixed(1) + 'px,' + (y - DOT.size / 2).toFixed(1) + 'px)' +
            ' scale(' + (1 + squash).toFixed(3) + ',' + (1 - squash).toFixed(3) + ')';
        }

        if (t < 1) {
          hopRaf = requestAnimationFrame(frame);
        } else {
          // Landed: squash the dot (Pixar stomp), reveal ".dev", fade ball out smoothly.
          periodEl.classList.add('is-squashed');
          hopper.classList.add('is-landed');
          dotStyle.transition = 'opacity 0.5s ease';
          dotStyle.opacity = '0';
          if (wordEl) wordEl.classList.add('dev-revealed');
          if (trailEl) { trailEl.style.display = 'none'; trailEl = null; }
          setTimeout(() => { hopper.style.display = 'none'; }, 550);
        }
      }
      requestAnimationFrame(frame);
    }

    // ---------- Intro timing ----------
    let lastPct = -1;
    function tick(now) {
      const pct = Math.min(100, ((now - start) / DURATION) * 100);
      if (bar) bar.style.width = pct + '%';
      if (percentEl) {
        const rounded = Math.round(pct);
        if (rounded !== lastPct) {
          percentEl.textContent = rounded + '%';
          lastPct = rounded;
        }
      }

      if (now - start >= HOP_START && !hopRaf) runHops();

      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Intro sequence finished — reveal the "Let's Go" button and wait for the click.
        loader.classList.add('is-ready');
      }
    }

    // ---------- Dismissal ----------
    function finish() {
      if (done) return;
      done = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (hopRaf) cancelAnimationFrame(hopRaf);
      if (removeTimer) clearTimeout(removeTimer);
      if (percentEl) percentEl.textContent = '100%';

      wordEl.classList.add('dev-revealed');
      loader.classList.add('is-hidden');
      document.body.classList.remove('loader-active');

      removeTimer = setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 900);

      window.dispatchEvent(new Event('portfolio:loaded'));
    }

    function skip(e) {
      if (e) e.preventDefault();
      finish();
    }

    // ---------- Interactive listeners ----------
    if (skipBtn) skipBtn.addEventListener('click', skip);
    loader.addEventListener('click', (e) => {
      if (e.target === loader) spawnClickRing(e.clientX, e.clientY);
    });

    // Any click on the screen during the intro spawns a ripple
    document.addEventListener('pointerdown', (e) => {
      if (!done) spawnClickRing(e.clientX, e.clientY);
    });

    // Mouse move -> particles react & glow follows
    document.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      targetX = e.clientX;
      targetY = e.clientY;
    });

    // Keyboard-only users: glow follows a slight idle drift
    document.addEventListener('keydown', () => {
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight / 2;
    });

    // ---------- Boot ----------
    window.addEventListener('resize', () => {
      resizeCanvas();
      spawnParticles();
    });

    resizeCanvas();
    spawnParticles();
    requestAnimationFrame(drawParticles);
    requestAnimationFrame(tickCursorGlow);
    runTerminal();

    // Loader stays on screen until the user clicks "Let's Go" — no auto-dismiss.

    requestAnimationFrame(tick);
  })();

  // 1. Theme Switcher (Pure Black <-> Pure White) with Realistic Bulb
  const themeToggleBtn = document.getElementById('theme-toggle');
  const realisticBulb = document.getElementById('realistic-bulb');
  const htmlRoot = document.documentElement;

  function updateThemeImages(theme) {
    const heroImg = document.getElementById('hero-profile-img');
    const navImg = document.getElementById('nav-profile-img');
    const imageSrc = theme === 'light' ? 'profile-light.jpg' : 'profile-dark.jpg';
    if (heroImg) heroImg.src = imageSrc;
    if (navImg) navImg.src = imageSrc;

    const bulbImg = document.getElementById('toggle-bulb-img');
    const bulbSrc = theme === 'light' ? 'bulb-light.png' : 'bulb-dark.png';
    if (bulbImg) bulbImg.src = bulbSrc;
  }

  // Retrieve saved theme or default to 'dark' (pure black)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlRoot.setAttribute('data-theme', savedTheme);
  updateThemeImages(savedTheme);

  function toggleThemeWithBulbEffect() {
    const currentTheme = htmlRoot.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeImages(newTheme);

    // Kick the bulb with a real physics impulse for a lively swing
    if (typeof kickBulb === 'function') kickBulb();
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleThemeWithBulbEffect);
  }

  if (realisticBulb) {
    realisticBulb.addEventListener('click', () => {
      toggleThemeWithBulbEffect();
    });
  }

  // 1.2 Interactive Real-Physics Bulb: spring-pendulum inside a bounded move arena
  const bulbStage = document.getElementById('bulb-stage');

  function initBulbPhysics(wrapper) {
    const stage = bulbStage || wrapper.parentElement || document.body;
    const wire = wrapper.querySelector('.bulb-wire');
    const assembly = wrapper.querySelector('.bulb-assembly');
    const cone = document.getElementById('bulb-light-cone');

    // Physical constants (pixel space, seconds)
    const WIRE_BASE = 18;          // anchor -> top of metal socket
    const TO_GLASS = 70;           // socket top -> bulb glass centre inside the SVG
    const L0 = WIRE_BASE + TO_GLASS; // natural cable length
    const R_MIN = L0 * 0.3;
    const R_MAX = L0 * 2.05;
    const G = 940;                 // gravity px/s^2
    const KS = 120;                // radial spring (bungee-cable) stiffness
    const DR = 2.0;                // radial damping
    const DA = 1.15;               // angular (pendulum) damping

    let r = L0, vR = 0;
    let theta = 0, vTheta = 0;
    let raf = 0, lastTime = 0;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function arena() {
      return {
        xMax: Math.max(40, stage.offsetWidth / 2 - 30),
        yMax: Math.max(60, stage.offsetHeight - 36)
      };
    }

    function anchor() {
      const rc = stage.getBoundingClientRect();
      return { x: rc.left + rc.width / 2, y: rc.top };
    }

    function polarXY(rr, tt) {
      return { x: Math.sin(tt) * rr, y: Math.cos(tt) * rr };
    }

    function applyVisual() {
      const rodLen = r - TO_GLASS;
      const wireLen = Math.max(2, rodLen);
      if (wire) wire.style.height = wireLen + 'px';
      if (assembly) assembly.style.top = (wireLen - 1) + 'px';
      wrapper.style.transform = 'translateX(-50%) rotate(' + (theta * 180 / Math.PI) + 'deg)';
      if (cone) {
        const bob = polarXY(r, theta);
        cone.style.transform =
          'translateX(calc(-50% + ' + bob.x.toFixed(1) + 'px)) translateY(' + (bob.y * 0.16).toFixed(1) + 'px)';
      }
    }

    function step(dt) {
      dt = clamp(dt, 0, 1 / 30);

      // Low-level ambient sway so the bulb never looks frozen.
      const now = performance.now();
      const amb = (Math.sin(now / 1500) + 0.6 * Math.sin(now / 760)) * 0.3;

      // Spring-pendulum equations of motion (semi-implicit Euler).
      // +G*cos(theta): gravity stretches the cable outward (weight droop).
      const ar = r * vTheta * vTheta - KS * (r - L0) - DR * vR + G * Math.cos(theta);
      const aTh = -(2 * vR * vTheta) / Math.max(r, 16)
                - (G / Math.max(r, 16)) * Math.sin(theta)
                - DA * vTheta + amb;

      vR += ar * dt;
      vTheta += aTh * dt;
      r += vR * dt;
      theta += vTheta * dt;

      // Hard walls that mirror the bounded move arena.
      r = clamp(r, R_MIN, R_MAX);
      const ar2 = arena();
      const maxT = Math.asin(clamp(ar2.xMax / Math.max(r, 1), -1, 1));
      if (Math.abs(theta) > maxT) {
        theta = clamp(theta, -maxT, maxT);
        vTheta *= -0.32; // damped bounce back off the edge
      }
      if (r * Math.cos(theta) > ar2.yMax) {
        r = ar2.yMax / Math.max(Math.cos(theta), 0.2);
        vR *= -0.32;
      }
    }

    function frame(t) {
      const dt = lastTime ? (t - lastTime) / 1000 : 1 / 60;
      lastTime = t;
      step(dt);
      applyVisual();
      raf = requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Pluck the pull chain for a quick downward bounce.
    function pluck() {
      vR += 150;
      vTheta *= 0.4;
      vTheta += (Math.random() < 0.5 ? -1 : 1) * 0.5;
    }

    const cord = wrapper.querySelector('.bulb-cord');
    if (cord) {
      cord.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); pluck(); });
      cord.addEventListener('click', (e) => e.stopPropagation());
    }

    // Called from the theme toggle to deliver a playful impulse.
    window.kickBulb = function () {
      vR += Math.max(40, Math.min(180, L0 * 0.8));
      vTheta += (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 0.9);
    };
  }

  if (realisticBulb) initBulbPhysics(realisticBulb);

  // 1.1 Typewriter Texting Animation for Hero Title
  const typewriterOutput = document.getElementById('typewriter-output');
  if (typewriterOutput) {
    const textPhrases = [
      "<span class='gradient-text'>Database Administration (DBA)</span>",
      "<span class='gradient-text'>Flask Web Development</span>",
      "<span class='gradient-text'>Data Analytics & Power BI</span>",
      "<span class='gradient-text'>AI/ML & RAG Model Engineering</span>",
      "<span class='gradient-text'>SQL & PL/SQL Database Optimization</span>",
      "<span class='gradient-text'>Python & Backend Systems</span>"
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function typeWriter() {
      const currentPhrase = textPhrases[phraseIndex];

      if (isDeleting) {
        // Strip HTML tags for clean backspacing calculation
        charIndex--;
        typewriterOutput.innerHTML = getRenderedText(currentPhrase, charIndex);
        typingSpeed = 40;
      } else {
        charIndex++;
        typewriterOutput.innerHTML = getRenderedText(currentPhrase, charIndex);
        typingSpeed = 85;
      }

      const plainTextLength = getPlainText(currentPhrase).length;

      if (!isDeleting && charIndex >= plainTextLength) {
        // Pause at complete phrase
        typingSpeed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % textPhrases.length;
        typingSpeed = 450;
      }

      setTimeout(typeWriter, typingSpeed);
    }

    // Helper to accurately extract text without breaking HTML tags during typing
    function getPlainText(html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    }

    function getRenderedText(html, length) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      let count = 0;

      function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const remaining = length - count;
          if (node.textContent.length > remaining) {
            node.textContent = node.textContent.substring(0, Math.max(0, remaining));
            count = length;
          } else {
            count += node.textContent.length;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          for (let i = 0; i < node.childNodes.length; i++) {
            if (count < length) {
              traverse(node.childNodes[i]);
            } else {
              node.removeChild(node.childNodes[i]);
              i--;
            }
          }
        }
      }

      traverse(tempDiv);
      return tempDiv.innerHTML;
    }

    // Start typing after initial delay
    setTimeout(typeWriter, 500);
  }

  // 2. Mobile Navigation Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking any nav item
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // 3. Navbar Scrolled State & Active Navigation Tracking
  const header = document.querySelector('header');
  const sections = document.querySelectorAll('section, .hero-section');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    // Highlight current section in navbar
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });

  // 4. Initialize AOS (Animate on Scroll)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }

  // 4.1 Project Image Sliders (interactive: swipe, drag, keyboard, progress bar)
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const track = slider.querySelector('.slider-track');
    const slides = slider.querySelectorAll('.slider-slide');
    const dotsWrap = slider.querySelector('[data-slider-dots]');
    const prevBtn = slider.querySelector('[data-slider-prev]');
    const nextBtn = slider.querySelector('[data-slider-next]');
    let current = 0;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;

    if (slides.length <= 1) return;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); resetAutoPlay(); });
      dotsWrap.appendChild(dot);
    });

    // Create slide counter
    const counter = document.createElement('span');
    counter.className = 'slider-counter';
    counter.textContent = '1 / ' + slides.length;
    slider.appendChild(counter);

    // Create progress bar
    const progressWrap = document.createElement('div');
    progressWrap.className = 'slider-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'slider-progress-bar';
    progressWrap.appendChild(progressBar);
    slider.appendChild(progressWrap);

    function updateUI() {
      dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
      counter.textContent = (current + 1) + ' / ' + slides.length;
      progressBar.style.width = ((current + 1) / slides.length * 100) + '%';
    }

    function goTo(index, animate = true) {
      current = (index + slides.length) % slides.length;
      if (!animate) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        prevTranslate = -current * slider.offsetWidth;
        currentTranslate = prevTranslate;
        requestAnimationFrame(() => { track.style.transition = ''; });
      } else {
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
      }
      updateUI();
    }

    // --- Touch / Drag support ---
    function getPositionX(event) {
      return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function touchStart(event) {
      isDragging = true;
      startX = getPositionX(event);
      track.classList.add('grabbing');
    }

    function touchMove(event) {
      if (!isDragging) return;
      const currentX = getPositionX(event);
      const diff = currentX - startX;
      currentTranslate = prevTranslate + diff;
      const clampedTranslate = Math.max(
        -(slides.length - 1) * slider.offsetWidth,
        Math.min(0, currentTranslate)
      );
      track.style.transition = 'none';
      track.style.transform = 'translateX(' + clampedTranslate + 'px)';
    }

    function touchEnd() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('grabbing');
      const movedBy = currentTranslate - prevTranslate;
      const threshold = slider.offsetWidth * 0.2;
      if (movedBy < -threshold && current < slides.length - 1) {
        goTo(current + 1);
      } else if (movedBy > threshold && current > 0) {
        goTo(current - 1);
      } else {
        goTo(current);
      }
      track.style.transition = '';
      prevTranslate = -current * slider.offsetWidth;
      currentTranslate = prevTranslate;
      resetAutoPlay();
    }

    slider.addEventListener('touchstart', touchStart, { passive: true });
    slider.addEventListener('touchmove', touchMove, { passive: true });
    slider.addEventListener('touchend', touchEnd);
    slider.addEventListener('mousedown', touchStart);
    slider.addEventListener('mousemove', touchMove);
    slider.addEventListener('mouseup', touchEnd);
    slider.addEventListener('mouseleave', () => { if (isDragging) touchEnd(); });
    slider.addEventListener('dragstart', e => e.preventDefault());

    // --- Keyboard navigation ---
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { goTo(current - 1); resetAutoPlay(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); resetAutoPlay(); }
    });

    // --- Arrow buttons ---
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); resetAutoPlay(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); resetAutoPlay(); });

    // --- Auto-advance with progress animation ---
    let autoTimer = null;
    let rafId = null;
    const AUTO_INTERVAL = 5000;
    let autoStart = 0;

    function animateProgress() {
      if (!autoTimer) return;
      const elapsed = Date.now() - autoStart;
      const pct = Math.min((elapsed / AUTO_INTERVAL) * 100, 100);
      progressBar.style.width = ((current + 1) / slides.length * 100) + '%';
      progressBar.style.background = 'linear-gradient(90deg, var(--accent-cyan) ' + pct + '%, transparent ' + pct + '%)';
      if (pct < 100) rafId = requestAnimationFrame(animateProgress);
    }

    function startAuto() {
      stopAuto();
      autoStart = Date.now();
      autoTimer = setTimeout(() => {
        goTo(current + 1);
        startAuto();
      }, AUTO_INTERVAL);
      animateProgress();
    }

    function stopAuto() {
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      progressBar.style.background = '';
    }

    function resetAutoPlay() {
      stopAuto();
      startAuto();
    }

    // Pause on hover (desktop) — restart when leaving
    slider.addEventListener('mouseenter', () => stopAuto());
    slider.addEventListener('mouseleave', () => startAuto());
    // Touch devices: stop auto-play while touching
    slider.addEventListener('touchstart', () => stopAuto(), { passive: true });
    slider.addEventListener('touchend', () => startAuto(), { passive: true });

    // Init
    goTo(0, false);
    startAuto();
  });

  // 5. Initialize EmailJS & Contact Form
  if (typeof emailjs !== 'undefined') {
    emailjs.init('9jlifRD_jpAIhUX87'); // Dushmanta's Public Key
  }

  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Send Message';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      }

      emailjs.sendForm('service_e7k1egn', 'template_3mx4ug8', this)
        .then(() => {
          showStatusMessage('✅ Message sent successfully! I will get back to you soon.', true);
          contactForm.reset();
        })
        .catch(error => {
          console.error('Email send error:', error);
          showStatusMessage('❌ Failed to send message. Please connect directly via WhatsApp or LinkedIn.', false);
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        });
    });
  }

  function showStatusMessage(msg, isSuccess) {
    if (!formMessage) return;
    formMessage.textContent = msg;
    formMessage.className = `form-message ${isSuccess ? 'success' : 'error'}`;
    formMessage.style.display = 'block';
    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 6000);
  }

  // 6. Interactive Anime S-Shape Academic Journey Logic
  const academicData = {
    1: {
      badge: "Secondary School (10th)", year: "2021",
      name: "Mount Litera Zee School, Tangi",
      board: "CBSE · Tangi, Khordha, Odisha",
      score: "71% Aggregate",
      desc: "Completed secondary education under CBSE board with strong fundamentals in Mathematics, Science, and Information Technology.",
      image: "mount litera zee.jpg",
      link: "https://www.mountliteratangi.in/",
      result: "10TH RES.pdf",
      ratio: 0.02   // highlight only to first dot
    },
    2: {
      badge: "Senior Secondary (12th)", year: "2023",
      name: "Oneness International School",
      board: "CBSE · Khordha, Odisha",
      score: "61% Aggregate",
      desc: "Completed Class 12th in Science stream focusing on Mathematics, Physics, Chemistry, and Computer Science principles.",
      image: "oneness.jpg",
      link: "https://www.onenessinternationalschool.com/",
      result: "12ESULT.pdf",
      ratio: 0.50   // highlight to midpoint (right curve)
    },
    3: {
      badge: "Current Degree", year: "2023 – 2027",
      name: "KMBB College of Engineering & Technology",
      board: "BPUT · Khordha, Odisha",
      score: "7.9 CGPA",
      desc: "Pursuing B.Tech in Computer Science & Engineering with core specialization in Database Management, AI/ML, Data Engineering, and Backend Architecture.",
      image: "kmbb.jpg",
      link: "https://www.kmbb.in/",
      result: null,
      ratio: 1.0    // highlight full path to destination
    }
  };

  const basePath   = document.getElementById('journey-base-track');
  const laserPath  = document.getElementById('journey-active-laser');
  const photonOrb  = document.getElementById('journey-photon-orb');
  let photonRaf    = null;

  // Set real path length once paths are rendered
  function initLaser() {
    if (!basePath || !laserPath) return;
    const totalLen = basePath.getTotalLength();
    laserPath.style.strokeDasharray  = totalLen;
    laserPath.style.strokeDashoffset = totalLen; // hidden initially
  }
  setTimeout(initLaser, 80);

  // Photon travels only along the highlighted portion (0 → maxRatio of path)
  function runPhoton(maxRatio) {
    if (!basePath || !photonOrb) return;
    if (photonRaf) cancelAnimationFrame(photonRaf);
    const totalLen  = basePath.getTotalLength();
    const maxDist   = totalLen * maxRatio;
    if (maxDist < 5) { photonOrb.style.opacity = '0'; return; }

    let dist = 0;
    const speed = 2.4;
    photonOrb.style.opacity = '1';

    function tick() {
      dist += speed;
      if (dist > maxDist) dist = 0;
      const pt = basePath.getPointAtLength(dist);
      photonOrb.setAttribute('cx', pt.x);
      photonOrb.setAttribute('cy', pt.y);
      photonRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  window.selectAcademicMilestone = function(step) {
    const d = academicData[step];
    if (!d) return;

    // 1) Highlight laser line up to the selected dot
    if (basePath && laserPath) {
      const totalLen = basePath.getTotalLength();
      laserPath.style.strokeDasharray  = totalLen;
      laserPath.style.strokeDashoffset = totalLen * (1 - d.ratio);
    }

    // 2) Run photon only along highlighted portion
    runPhoton(d.ratio);

    // 3) Activate/deactivate SVG dots
    [1, 2, 3].forEach(i => {
      const dot   = document.getElementById('dot-' + i);
      const label = document.getElementById('label-' + i);
      if (dot)   dot.classList.toggle('active-dot',   i === step);
      if (label) label.classList.toggle('active-label', i === step);
    });

    // 4) Fade-swap the spotlight HUD card
    const card = document.getElementById('journey-spotlight-display');
    if (card) {
      card.style.opacity   = '0.3';
      card.style.transform = 'translateY(5px)';
      setTimeout(() => {
        const el = (id) => document.getElementById(id);
        if (el('spotlight-img'))   el('spotlight-img').src          = d.image;
        if (el('spotlight-badge')) el('spotlight-badge').textContent = d.badge;
        if (el('spotlight-year'))  el('spotlight-year').innerHTML    = `<i class="fa-regular fa-calendar"></i> ${d.year}`;
        if (el('spotlight-name'))  el('spotlight-name').textContent  = d.name;
        if (el('spotlight-board')) el('spotlight-board').textContent = d.board;
        if (el('spotlight-score')) el('spotlight-score').textContent = d.score;
        if (el('spotlight-desc'))  el('spotlight-desc').textContent  = d.desc;
        if (el('spotlight-link'))  el('spotlight-link').href         = d.link;
        const resultPill = el('spotlight-result-pill');
        if (resultPill) {
          if (d.result) {
            resultPill.href = d.result;
            resultPill.style.display = 'inline-flex';
            resultPill.style.pointerEvents = 'auto';
            resultPill.title = 'Click to view result';
          } else {
            resultPill.removeAttribute('href');
            resultPill.style.pointerEvents = 'none';
            resultPill.title = '';
          }
        }
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      }, 150);
    }
  };

  // Boot with KMBB (destination) selected
  setTimeout(() => selectAcademicMilestone(3), 150);

  // Skill card tap-to-reflect (mobile)
  document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.remove('is-active');
      void card.offsetWidth;
      card.classList.add('is-active');
    });
  });
  document.addEventListener('animationend', e => {
    if (e.animationName === 'glassReflection') {
      e.target.classList.remove('is-active');
    }
  });

  // Certificate preview modal (lightbox)
  const certModal = document.getElementById('thiranex-modal');
  if (certModal) {
    const openModal = () => {
      certModal.classList.add('is-open');
      certModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
      certModal.classList.remove('is-open');
      certModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('[data-cert-modal]').forEach(btn => {
      btn.addEventListener('click', openModal);
    });
    certModal.querySelectorAll('[data-cert-close]').forEach(el => {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && certModal.classList.contains('is-open')) closeModal();
    });
  }
});

