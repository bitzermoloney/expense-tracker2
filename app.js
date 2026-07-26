const form = document.getElementById('authForm');
const message = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const nameInput = document.getElementById('nameInput');
const modeButtons = document.querySelectorAll('.mode-btn');
const storageKey = 'expense-tracker-users';

let currentMode = 'login';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(storageKey, JSON.stringify(users));
}

function setMode(mode) {
  currentMode = mode;
  document.querySelector('.mode-btn.active')?.classList.remove('active');
  document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');
  submitButton.textContent = mode === 'register' ? 'Create account' : 'Login';
  nameInput.parentElement.style.display = mode === 'register' ? 'flex' : 'none';
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    message.textContent = 'Please enter your email and password.';
    return;
  }

  const users = readUsers();

  if (currentMode === 'register') {
    const name = document.getElementById('nameInput').value.trim();

    if (!name) {
      message.textContent = 'Please enter your name.';
      return;
    }

    if (users.some((user) => user.email === email)) {
      message.textContent = 'An account with that email already exists.';
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    message.textContent = `Welcome, ${name}! Your account has been created.`;
    form.reset();
    setMode('login');
    return;
  }

  const user = users.find((entry) => entry.email === email && entry.password === password);

  if (user) {
    message.textContent = `Welcome back, ${user.name}!`;
  } else {
    message.textContent = 'Invalid email or password.';
  }
});

setMode('login');
