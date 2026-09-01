document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. MOBILE MENU TOGGLE
  // ==========================================
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // ==========================================
  // 2. BOOKING FORM VALIDATION
  // ==========================================
  const bookingForm = document.getElementById('booking-form');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('client-name');
      const phoneInput = document.getElementById('client-phone');
      const serviceInput = document.getElementById('client-service');
      const dateInput = document.getElementById('client-date');

      // Agar kisi page par form ke fields na hon toh code ruk jaye
      if (!nameInput || !phoneInput || !serviceInput || !dateInput) return;

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const service = serviceInput.value;
      const date = dateInput.value;

      if (!name || !phone || !service || !date) {
        alert('Baraye meherhani tamam zaroori khane pur karein.');
        return;
      }

      if (phone.length < 10) {
        alert('Baraye meherhani sahi Mobile Number dakhil karein.');
        return;
      }

      // Simple '+' String Concatenation (Zero Syntax Errors)
      alert('Shukriya ' + name + '! Aap ki appointment (' + service + ') ' + date + ' ke liye receive ho gayi hai.');

      bookingForm.reset();
    });
  }

  // ==========================================
  // 3. SMOOTH SCROLL FOR BUTTONS
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

});