// Demo-only password gate. Not real security: the password is shown right
// on the login screen, and a sessionStorage flag is all that is checked.
// In a real version, each barber would have their own secure login.

const SESSION_KEY = 'fd-admin-auth';
const DEMO_PASSWORD = 'demo';

function isAuthenticated() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function setAuthenticated(value) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, 'true');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable: the gate simply won't persist across reloads.
  }
}

// True when the URL carries a "view this appointment" link from the booking
// success screen (?date=...&rdv=<id>) — the whole point of that shortcut is
// to skip the login screen, so a real barber login isn't demonstrated there.
function hasPresentationLink() {
  return new URLSearchParams(location.search).has('rdv');
}

export function initAuth({ onAuthenticated }) {
  const loginScreen = document.querySelector('[data-login-screen]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const form = document.querySelector('[data-login-form]');
  const input = document.querySelector('[data-login-password]');
  const error = document.querySelector('[data-login-error]');
  const demoLoginBtn = document.querySelector('[data-demo-login]');

  function showDashboard() {
    loginScreen.hidden = true;
    dashboard.hidden = false;
    onAuthenticated();
  }

  function showLogin() {
    dashboard.hidden = true;
    loginScreen.hidden = false;
    input.value = '';
    input.focus();
  }

  if (isAuthenticated() || hasPresentationLink()) {
    setAuthenticated(true);
    showDashboard();
  } else {
    showLogin();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value === DEMO_PASSWORD) {
      error.hidden = true;
      setAuthenticated(true);
      showDashboard();
    } else {
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
    }
  });

  demoLoginBtn.addEventListener('click', () => {
    setAuthenticated(true);
    showDashboard();
  });
}
