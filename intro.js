// Introduction Page JavaScript

// Ripple effect on button click
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousedown', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    // Remove existing ripples
    const existingRipple = this.querySelector('.ripple');
    if (existingRipple) existingRipple.remove();
    
    this.appendChild(ripple);
  });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    navbar.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.7)';
    navbar.style.boxShadow = 'none';
  }
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe feature cards and service items
document.querySelectorAll('.feature-card, .service-item, .contact-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Add some interactivity to buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px)';
  });
  
  btn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
  });
});

// Counter animation for stats
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');
  
  counters.forEach(counter => {
    const target = parseInt(counter.textContent);
    let current = 0;
    const increment = target / 30;
    
    const updateCounter = () => {
      if (current < target) {
        current += increment;
        counter.textContent = Math.floor(current) + (counter.textContent.includes('+') ? '+' : counter.textContent.includes('%') ? '%' : '');
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = counter.originalText || counter.textContent;
      }
    };
    
    counter.originalText = counter.textContent;
    
    // Trigger animation when stats come into view
    observer.observe(counter);
  });
}

// Initialize counter animation when hero is in view
const heroSection = document.querySelector('.hero');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      animateCounters();
    }
  });
}, { threshold: 0.5 });

if (heroSection) {
  counterObserver.observe(heroSection);
}

// Mobile menu toggle (if needed for future)
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.style.display = navLinks.style.display === 'none' ? 'flex' : 'none';
  }
}

// Prevent body scroll when accessing certain sections
document.addEventListener('DOMContentLoaded', () => {
  // Add smooth transitions to all links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

// Landing booking form handler
const landingForm = document.getElementById('landingBookingForm');
if (landingForm) {
  landingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(landingForm);
    const name = form.get('name');
    const email = form.get('email');
    const service = form.get('service');
    const date = form.get('date') || null;
    const time = form.get('time') || '';
    const timezone = form.get('timezone') || 'UTC';

    if (!name || !email || !service) {
      alert('Please fill name, email and select a service');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token && !confirm('You are not logged in. We can still create a booking, but you will not have a session. Continue?')) return;

    try {
      const res = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': token || ''
        },
        body: JSON.stringify({ name, email, service, date, time, timezone, notes: '' })
      });
      const data = await res.json();
      if (!data || !data.success) {
        alert('Could not create booking. Please try again later.');
        return;
      }

      const booking = data.booking;
      const receiptDiv = document.getElementById('landingBookingReceipt');
      receiptDiv.innerHTML = `<div class="receipt-header"><div class="receipt-title">Booking Received</div><div class="receipt-number">ID: ${booking.id}</div></div><div class="receipt-content"><div>Service: ${service}</div><div>Date: ${date || 'TBD'}</div><div>Time: ${time || 'TBD'}</div></div>`;
      receiptDiv.style.display = 'block';
      landingForm.reset();
      receiptDiv.scrollIntoView({ behavior: 'smooth' });
        // show email preview toast if provided (dev)
        if (data.previewUrl || data.adminPreviewUrl) {
          showEmailToast(data.previewUrl, data.adminPreviewUrl);
        }
    } catch (err) {
      console.error('Landing booking error', err);
      alert('Network error: could not submit booking.');
    }
  });
}

// Small toast for email preview links
function showEmailToast(previewUrl, adminUrl) {
  const id = 'emailPreviewToast';
  let t = document.getElementById(id);
  if (!t) {
    t = document.createElement('div');
    t.id = id;
    t.style.position = 'fixed';
    t.style.right = '18px';
    t.style.bottom = '18px';
    t.style.zIndex = 9999;
    t.style.maxWidth = '320px';
    t.style.background = 'rgba(10,20,40,0.95)';
    t.style.color = '#fff';
    t.style.padding = '12px 14px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 6px 22px rgba(0,0,0,0.3)';
    t.style.fontSize = '13px';
    document.body.appendChild(t);
  }
  t.innerHTML = `<div style="margin-bottom:8px;font-weight:600">Booking email sent</div>` +
    (previewUrl ? `<div style="margin-bottom:6px"><a href="${previewUrl}" target="_blank" style="color:#9be7ff">Open user email preview</a></div>` : '') +
    (adminUrl ? `<div><a href="${adminUrl}" target="_blank" style="color:#ffd19a">Open admin email preview</a></div>` : '');
  t.style.display = 'block';
  setTimeout(() => { if (t) t.style.display = 'none'; }, 20000);
}
