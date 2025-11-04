const accordionTriggers = document.querySelectorAll('.accordion__trigger');

accordionTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    const panel = trigger.nextElementSibling;

    trigger.setAttribute('aria-expanded', String(!expanded));
    panel.classList.toggle('active');

    if (!expanded) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

const STORAGE_KEY = 'italianoDoZeroAppState';
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const defaultState = {
  user: null,
  preferences: {
    darkMode: systemPrefersDark,
    fontSize: 'default',
  },
};

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function sanitizeState(rawState) {
  if (!rawState || typeof rawState !== 'object') {
    return cloneState(defaultState);
  }

  const safeState = cloneState(defaultState);

  if (rawState.user && rawState.user.name) {
    safeState.user = {
      name: String(rawState.user.name).trim(),
      email: rawState.user.email ? String(rawState.user.email).trim() : '',
    };
  }

  if (rawState.preferences && typeof rawState.preferences === 'object') {
    if (typeof rawState.preferences.darkMode === 'boolean') {
      safeState.preferences.darkMode = rawState.preferences.darkMode;
    }
    if (['default', 'large', 'small'].includes(rawState.preferences.fontSize)) {
      safeState.preferences.fontSize = rawState.preferences.fontSize;
    }
  }

  return safeState;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return cloneState(defaultState);
    }

    const parsed = JSON.parse(saved);
    return sanitizeState(parsed);
  } catch (error) {
    console.warn('Não foi possível carregar as preferências salvas.', error);
    return cloneState(defaultState);
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Não foi possível salvar suas preferências.', error);
  }
}

const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const loginModal = document.getElementById('loginModal');
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const settingsForm = document.getElementById('settingsForm');
const darkModeToggle = document.getElementById('prefDarkMode');
const fontSizeSelect = document.getElementById('prefFontSize');
const resetPreferencesButton = document.getElementById('resetPreferences');

function getFocusableElements(modal) {
  return modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
}

function openModal(modal) {
  if (!modal) return;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-modal');

  const focusable = getFocusableElements(modal);
  if (focusable.length) {
    focusable[0].focus();
  }
}

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');

  if (!document.querySelector('.modal.is-open')) {
    document.body.classList.remove('has-modal');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.is-open').forEach((modal) => closeModal(modal));
}

function applyPreferences() {
  document.body.classList.toggle('theme-dark', Boolean(state.preferences.darkMode));

  if (state.preferences.fontSize === 'default') {
    document.body.removeAttribute('data-font-size');
  } else {
    document.body.setAttribute('data-font-size', state.preferences.fontSize);
  }

  if (darkModeToggle) {
    darkModeToggle.checked = state.preferences.darkMode;
  }

  if (fontSizeSelect) {
    fontSizeSelect.value = state.preferences.fontSize;
  }
}

function updateUserUI() {
  if (!loginButton || !userMenu) return;

  if (state.user) {
    loginButton.hidden = true;
    userMenu.hidden = false;

    const firstName = state.user.name.split(' ')[0];
    userName.textContent = `Olá, ${firstName}!`;
    userAvatar.textContent = state.user.name.charAt(0).toUpperCase();
  } else {
    loginButton.hidden = false;
    userMenu.hidden = true;
    userName.textContent = '';
    userAvatar.textContent = '';
  }
}

function syncForms() {
  applyPreferences();
}

syncForms();
updateUserUI();

if (settingsButton) {
  settingsButton.addEventListener('click', () => {
    syncForms();
    openModal(settingsModal);
  });
}

if (loginButton) {
  loginButton.addEventListener('click', () => {
    openModal(loginModal);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    state.user = null;
    state.preferences = cloneState(defaultState.preferences);
    applyPreferences();
    saveState();
    updateUserUI();
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginError.textContent = '';

    const formData = new FormData(loginForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();

    if (!name || !email) {
      loginError.textContent = 'Preencha nome e email para continuar.';
      return;
    }

    state.user = { name, email };
    saveState();
    updateUserUI();
    closeModal(loginModal);
    loginForm.reset();
  });
}

if (settingsForm) {
  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    state.preferences.darkMode = Boolean(darkModeToggle && darkModeToggle.checked);
    state.preferences.fontSize = fontSizeSelect ? fontSizeSelect.value : 'default';

    applyPreferences();
    saveState();
    closeModal(settingsModal);
  });
}

if (resetPreferencesButton) {
  resetPreferencesButton.addEventListener('click', () => {
    state.preferences = cloneState(defaultState.preferences);
    applyPreferences();
    saveState();
  });
}

function handleModalInteractions(modal) {
  if (!modal) return;

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close]')) {
      closeModal(modal);
    }
  });
}

handleModalInteractions(loginModal);
handleModalInteractions(settingsModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeAllModals();
  }

  if (event.key === 'Tab') {
    const activeModal = document.querySelector('.modal.is-open');
    if (!activeModal) {
      return;
    }

    const focusable = Array.from(getFocusableElements(activeModal));
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else if (document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    state = loadState();
    syncForms();
    updateUserUI();
  }
});
