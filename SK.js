document.addEventListener('DOMContentLoaded', function(){
  // Service pricing map
  const servicePricing = {
    'crown': { name: 'Ceramic Crown', price: 120 },
    'bridge': { name: 'Fixed Bridge', price: 220 },
    'veneer': { name: 'Aesthetic Veneer', price: 180 }
  };

  // Booking form submission
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(bookingForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const service = formData.get('service');
      const date = formData.get('date');
      const time = formData.get('time') || '';
      const timezone = formData.get('timezone') || 'UTC';

      // Require basic fields
      if (!name || !email || !service) {
        alert('Please provide name, email and select a service.');
        return;
      }

      // Frontend-only booking simulation (backend removed).
      try {
        // Create a local booking object to simulate server response
        const booking = {
          id: 'LOCAL-' + Date.now().toString(36),
          name,
          email,
          phone,
          service,
          date: date || null,
          time: time || '',
          timezone: timezone || 'UTC',
          notes: '',
          createdAt: new Date().toISOString()
        };
        const serviceInfo = servicePricing[service] || { name: 'Unknown Service', price: 0 };
        const receiptNumber = 'RCP-' + Date.now().toString().slice(-8);
        const receiptDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        let appointmentDate = 'To be scheduled';
        if (date) {
          if (time) appointmentDate = `${date} ${time} (${timezone})`;
          else appointmentDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Create receipt HTML (same as before)
        const receiptHTML = `
          <div class="receipt-header">
            <div class="receipt-title">Booking Confirmed</div>
            <div class="receipt-subtitle">Dr. Bensefia Dental Clinic</div>
            <div class="receipt-number">Receipt #: ${receiptNumber}</div>
            <div class="receipt-number">Date: ${receiptDate}</div>
          </div>
          
          <div class="receipt-content">
            <div class="receipt-item">
              <div class="receipt-item-label">Patient Name</div>
              <div class="receipt-item-value">${name}</div>
            </div>
            <div class="receipt-item">
              <div class="receipt-item-label">Email</div>
              <div class="receipt-item-value">${email}</div>
            </div>
            <div class="receipt-item">
              <div class="receipt-item-label">Phone</div>
              <div class="receipt-item-value">${phone}</div>
            </div>
            <div class="receipt-item highlight">
              <div class="receipt-item-label">Service</div>
              <div class="receipt-item-value">${serviceInfo.name}</div>
            </div>
            <div class="receipt-item highlight">
              <div class="receipt-item-label">Appointment Date</div>
              <div class="receipt-item-value">${appointmentDate}</div>
            </div>
            ${time ? `<div class="receipt-item"><div class="receipt-item-label">Time</div><div class="receipt-item-value">${time} (${timezone})</div></div>` : ''}
          </div>
          
          <div class="receipt-summary">
            <div class="receipt-summary-row">
              <span>Service Cost:</span>
              <span>USD ${serviceInfo.price}</span>
            </div>
            <div class="receipt-summary-row">
              <span>Consultation Fee:</span>
              <span>USD 0</span>
            </div>
            <div class="receipt-summary-row">
              <span>Total Amount:</span>
              <span>USD ${serviceInfo.price}</span>
            </div>
          </div>
          
          <div class="receipt-actions">
            <button class="receipt-btn receipt-btn-primary" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="receipt-btn receipt-btn-secondary" id="bookAnotherBtn">Book Another</button>
          </div>
        `;

        // Display receipt
        const receiptDiv = document.getElementById('bookingReceipt');
        receiptDiv.innerHTML = receiptHTML;
        receiptDiv.style.display = 'block';

        // Hide form
        bookingForm.style.display = 'none';

        // Wire book another
        const bookAnotherBtn = document.getElementById('bookAnotherBtn');
        if (bookAnotherBtn) bookAnotherBtn.addEventListener('click', () => {
          bookingForm.style.display = 'block';
          bookingForm.reset();
          receiptDiv.style.display = 'none';
          bookingForm.scrollIntoView({ behavior: 'smooth' });
        });

        // Scroll to receipt
        setTimeout(() => {
          receiptDiv.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // No backend available — no email previews to show in frontend-only mode.

      } catch (err) {
        console.error('Booking error', err);
        alert('Network error: could not submit booking.');
      }
    });
  }

  // Logout button functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', function(){
        if(confirm('Are you sure you want to logout?')){
        // Clear local auth flag (frontend-only) and redirect to home.
        try { localStorage.removeItem('authToken'); } catch(e){}
        window.location.href = 'index.html';
      }
    });
  }

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme');
  const currentTheme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
  if(currentTheme === 'dark') document.documentElement.setAttribute('data-theme','dark');

  if(themeToggle){
    themeToggle.addEventListener('click', function(){
      const theme = document.documentElement.getAttribute('data-theme');
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  if(prefersDarkScheme && prefersDarkScheme.addEventListener){
    prefersDarkScheme.addEventListener('change', function(e){
      if(!localStorage.getItem('theme')){
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    });
  }

  // Edit display name (safe)
  const openEdit = document.getElementById('openEdit');
  if(openEdit){
    openEdit.addEventListener('click', function(){
      const nameEl = document.getElementById('name');
      const current = nameEl ? nameEl.textContent : '';
      const newName = prompt('Enter a new display name for the doctor:', current || '');
      if(newName && nameEl) nameEl.textContent = newName;
    });
  }

  // Download CV (safe)
  const downloadCv = document.getElementById('downloadCv');
  if(downloadCv){
    downloadCv.addEventListener('click', function(){
      const cvName = document.getElementById('cvName');
      const cvSpec = document.getElementById('cvSpec');
      const name = cvName ? cvName.textContent : 'CV';
      const spec = cvSpec ? cvSpec.textContent : '';
      const text = `Curriculum Vitae\n${name}\nSpecialty: ${spec}`;
      const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '_CV.txt'; a.click();
    });
  }

  // Call / Message
  const callBtn = document.getElementById('callBtn'); if(callBtn) callBtn.addEventListener('click', function(){ alert('Demo: Redirecting to call the clinic'); });
  const msgBtn = document.getElementById('msgBtn'); if(msgBtn) msgBtn.addEventListener('click', function(){ alert('Demo: Messaging interface — integrate WhatsApp or email later'); });

  // Profile photo update (safe)
  const profilePhoto = document.querySelector('.doctor-aside-photo');
  if(profilePhoto){
    profilePhoto.addEventListener('click', function(){
      const url = prompt('Enter an image URL for the profile photo (or leave blank):');
      if(url) profilePhoto.src = url;
    });
  }

  // Simple confetti placeholder
  function confetti(){
    const c = document.createElement('div');
    c.style.position='fixed'; c.style.inset=0; c.style.pointerEvents='none';
    document.body.appendChild(c);
    setTimeout(function(){document.body.removeChild(c);},1200);
  }

// Small toast for email preview links
function showEmailToast(previewUrl, adminUrl) {
  const id = 'emailPreviewToastSK';
  let t = document.getElementById(id);
  if (!t) {
    t = document.createElement('div');
    t.id = id;
    t.style.position = 'fixed';
    t.style.right = '18px';
    t.style.bottom = '18px';
    t.style.zIndex = 9999;
    t.style.maxWidth = '360px';
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

  // Highlight centered testimonial in horizontal scroller
  try{
    const scroller = document.querySelector('.testimonials-grid');
    if(scroller){
      const cards = Array.from(scroller.querySelectorAll('.testimonial-card'));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const el = entry.target;
          if(entry.intersectionRatio > 0.55){
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });
      }, {
        root: scroller,
        rootMargin: '0px',
        threshold: [0.55]
      });
      cards.forEach(c => observer.observe(c));
    }
  }catch(e){console.warn('testimonial observer failed', e)}
});