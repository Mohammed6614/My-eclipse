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
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(bookingForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const service = formData.get('service');
      const date = formData.get('date');
      
      const serviceInfo = servicePricing[service] || { name: 'Unknown Service', price: 0 };
      const receiptNumber = 'RCP-' + Date.now().toString().slice(-8);
      const receiptDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      // Format appointment date
      const appointmentDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      // Create receipt HTML
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
          <button class="receipt-btn receipt-btn-secondary" onclick="document.getElementById('bookingForm').style.display='block'; document.getElementById('bookingForm').reset(); document.getElementById('bookingReceipt').style.display='none'; document.getElementById('bookingForm').scrollIntoView({behavior: 'smooth'});">Book Another</button>
        </div>
      `;
      
      // Display receipt
      const receiptDiv = document.getElementById('bookingReceipt');
      receiptDiv.innerHTML = receiptHTML;
      receiptDiv.style.display = 'block';
      
      // Hide form
      bookingForm.style.display = 'none';
      
      // Scroll to receipt
      setTimeout(() => {
        receiptDiv.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  // Logout button functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', function(){
      if(confirm('Are you sure you want to logout?')){
        auth.logout();
        window.location.href = 'login.html';
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