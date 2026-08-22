/**
 * Dushmanta Das - Portfolio Interactive Logic
 * Theme Switcher, Mobile Navigation, Contact Form & Smooth UX
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Switcher (Pure Black <-> Pure White) with Realistic Bulb
  const themeToggleBtn = document.getElementById('theme-toggle');
  const realisticBulb = document.getElementById('realistic-bulb');
  const htmlRoot = document.documentElement;

  // Retrieve saved theme or default to 'dark' (pure black)
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlRoot.setAttribute('data-theme', savedTheme);

  function toggleThemeWithBulbEffect() {
    const currentTheme = htmlRoot.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

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
});
