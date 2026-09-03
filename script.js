/**
 * Dushmanta Das - Portfolio Interactive Logic
 * Theme Switcher, Mobile Navigation, Contact Form & Smooth UX
 */

document.addEventListener('DOMContentLoaded', () => {
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

    // Trigger realistic swing animation on bulb
    if (realisticBulb) {
      realisticBulb.classList.remove('swinging');
      void realisticBulb.offsetWidth; // Trigger DOM reflow to restart animation
      realisticBulb.classList.add('swinging');
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleThemeWithBulbEffect);
  }

  if (realisticBulb) {
    realisticBulb.addEventListener('click', toggleThemeWithBulbEffect);
  }

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
});

