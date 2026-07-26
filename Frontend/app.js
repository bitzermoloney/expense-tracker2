const form = document.getElementById('authForm');
const message = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const nameInput = document.getElementById('nameInput');
const modeButtons = document.querySelectorAll('.mode-btn');

let currentMode = 'login';

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

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    email: document.getElementById('emailInput').value,
    password: document.getElementById('passwordInput').value
  };

  if (currentMode === 'register') {
    payload.name = document.getElementById('nameInput').value;
  }

  message.textContent = 'Working...';

  try {
    const response = await fetch(`/api/${currentMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    message.textContent = data.message || 'Success!';
    form.reset();
    setMode(currentMode);
  } catch (error) {
    message.textContent = error.message;
  }
});

setMode('login');
