// Login form validation and interaction (now using backend API)
const API_BASE = 'http://localhost:3000/api';
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const statusDiv = document.getElementById('status');
const toast = document.getElementById('toast');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Clear error messages on input
emailInput.addEventListener('input', () => {
  emailError.textContent = '';
  statusDiv.className = '';
  hidePopup();
});

passwordInput.addEventListener('input', () => {
  passwordError.textContent = '';
  statusDiv.className = '';
  hidePopup();
});

// Login form submission (uses backend API)
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  let isValid = true;

  // Validate email
  if (!email) {
    showPopup('Please enter your email address', 'error');
    isValid = false;
  } else if (!emailRegex.test(email)) {
    showPopup('Please enter a valid email address (example: name@example.com)', 'error');
    isValid = false;
  }

  // Validate password
  if (!password) {
    showPopup('Please enter your password', 'error');
    isValid = false;
  } else if (password.length < 6) {
    showPopup('Password must be at least 6 characters', 'error');
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data && data.success) {
      // store session
      auth.setSession(data.token, data.user);
      statusDiv.textContent = '✓ Login successful! Redirecting...';
      statusDiv.className = 'login-status success';
      setTimeout(() => {
        showToast(`Welcome back to Dr. Bensefia Clinic, ${email.split('@')[0]}!`);
        loginForm.reset();
        statusDiv.className = '';
        window.location.href = 'SK.html';
      }, 800);
      return;
    }

    const reason = data && data.reason ? data.reason : 'unknown';
    if (reason === 'not_verified') {
      showPopup('✗ Email not verified. A verification email will be sent.', 'error');
      await fetch(`${API_BASE}/send-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      showPopup('Verification email sent. Check your inbox and click the link, or open the Verify page.', 'success');
    } else if (reason === 'not_found') {
      if (confirm('No account found. Create an account with this email and password?')) {
        const regRes = await fetch(`${API_BASE}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const regData = await regRes.json();
        if (regData && regData.success) {
          showPopup('Account created. A verification email was sent. Please verify before logging in.', 'success');
        } else {
          showPopup('Registration failed. Please try again.', 'error');
        }
      }
    } else if (reason === 'invalid_credentials') {
      showPopup('✗ Invalid credentials. Please check your email and password.', 'error');
    } else {
      showPopup('✗ Login failed. Please try again.', 'error');
    }
  } catch (err) {
    showPopup('Network error: could not reach authentication server.', 'error');
    console.error(err);
  }
});

// Forgot password handler
function handleForgotPassword(e) {
  e.preventDefault();
  showToast('Password reset link sent to your email');
}

// Toast notification function
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast show';
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Popup card functions
function showPopup(message, type = 'info') {
  const popup = document.getElementById('popupCard');
  if (!popup) return;
  popup.className = `popup show ${type}`;
  popup.setAttribute('aria-hidden', 'false');
  popup.innerHTML = `<div class="popup-content"><div class="popup-message">${message}</div><button class="popup-close" aria-label="Close">×</button></div>`;
  const btn = popup.querySelector('.popup-close');
  if (btn) btn.addEventListener('click', hidePopup);
  // Auto hide
  if (window._popupTimeout) clearTimeout(window._popupTimeout);
  window._popupTimeout = setTimeout(hidePopup, 4500);
}

function hidePopup() {
  const popup = document.getElementById('popupCard');
  if (!popup) return;
  popup.classList.remove('show');
  popup.setAttribute('aria-hidden', 'true');
  if (window._popupTimeout) clearTimeout(window._popupTimeout);
  setTimeout(() => { if (popup) popup.innerHTML = ''; }, 260);
}

// Add some polish: input focus effects
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('focus', () => {
    input.parentElement.style.transform = 'scale(1.02)';
  });
  
  input.addEventListener('blur', () => {
    input.parentElement.style.transform = 'scale(1)';
  });
});