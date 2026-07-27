const authForm = document.getElementById('authForm');
const authMessage = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const nameInput = document.getElementById('nameInput');
const nameField = nameInput.closest('.field');
const modeButtons = document.querySelectorAll('.mode-btn');
const authSection = document.getElementById('authSection');
const expensesSection = document.getElementById('expensesSection');
const logoutButton = document.getElementById('logoutButton');
const expenseForm = document.getElementById('expenseForm');
const expenseMessage = document.getElementById('expenseMessage');
const expenseTableBody = document.getElementById('expenseTableBody');
const totalSpend = document.getElementById('totalSpend');
const currentUserLabel = document.getElementById('currentUserLabel');
const expenseSubmitButton = document.getElementById('expenseSubmitButton');
const storageKey = 'expense-tracker-users';
const expensesStorageKey = 'expense-tracker-expenses';

let currentMode = 'login';
let currentUser = null;
let editingExpenseId = null;

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

function readExpenses() {
  try {
    return JSON.parse(localStorage.getItem(expensesStorageKey)) || {};
  } catch (error) {
    return {};
  }
}

function saveExpenses(expensesByUser) {
  localStorage.setItem(expensesStorageKey, JSON.stringify(expensesByUser));
}

function getExpensesForUser(email) {
  const expensesByUser = readExpenses();
  return expensesByUser[email] || [];
}

function saveExpensesForUser(email, expenses) {
  const expensesByUser = readExpenses();
  expensesByUser[email] = expenses;
  saveExpenses(expensesByUser);
}

function setMode(mode) {
  currentMode = mode;
  document.querySelector('.mode-btn.active')?.classList.remove('active');
  document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');
  submitButton.textContent = mode === 'register' ? 'Create account' : 'Login';
  nameField.style.display = mode === 'register' ? 'flex' : 'none';
}

function resetExpenseForm() {
  expenseForm.reset();
  editingExpenseId = null;
  expenseSubmitButton.textContent = 'Add expense';
  document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);
}

function showAuthView() {
  authSection.classList.remove('hidden');
  expensesSection.classList.add('hidden');
  authForm.reset();
  setMode('login');
  authMessage.textContent = '';
}

function startEditingExistingExpense(user) {
  const expenses = getExpensesForUser(user.email);

  if (!expenses.length) {
    expenseSubmitButton.textContent = 'Add expense';
    expenseMessage.textContent = '';
    return false;
  }

  const expenseToEdit = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  editingExpenseId = expenseToEdit.id;
  document.getElementById('expenseDescription').value = expenseToEdit.description;
  document.getElementById('expenseAmount').value = expenseToEdit.amount;
  document.getElementById('expenseDate').value = expenseToEdit.date;
  document.getElementById('expenseCategory').value = expenseToEdit.category;
  expenseSubmitButton.textContent = 'Save expense';
  expenseMessage.textContent = 'Editing expense.';
  return true;
}

function showExpensesView(user) {
  currentUser = user;
  authSection.classList.add('hidden');
  expensesSection.classList.remove('hidden');
  currentUserLabel.textContent = user.name;
  resetExpenseForm();
  renderExpenses();
  startEditingExistingExpense(user);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function renderExpenses() {
  if (!currentUser) {
    expenseTableBody.innerHTML = '';
    totalSpend.textContent = formatCurrency(0);
    return;
  }

  const expenses = getExpensesForUser(currentUser.email);
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  totalSpend.textContent = formatCurrency(total);

  if (!expenses.length) {
    expenseTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No expenses yet. Add your first one above.</td></tr>';
    return;
  }

  expenseTableBody.innerHTML = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((expense) => `
      <tr>
        <td>${expense.description}</td>
        <td><span class="category-badge">${expense.category}</span></td>
        <td>${formatCurrency(Number(expense.amount))}</td>
        <td>${expense.date}</td>
        <td>
          <button class="action-btn edit" data-action="edit" data-id="${expense.id}" type="button">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${expense.id}" type="button">Delete</button>
        </td>
      </tr>
    `)
    .join('');
}

function handleExpenseAction(event) {
  const button = event.target.closest('button[data-action]');

  if (!button || !currentUser) {
    return;
  }

  const { action, id } = button.dataset;
  const expenses = getExpensesForUser(currentUser.email);
  const expense = expenses.find((item) => item.id === id);

  if (!expense) {
    return;
  }

  if (action === 'delete') {
    const updated = expenses.filter((item) => item.id !== id);
    saveExpensesForUser(currentUser.email, updated);
    expenseMessage.textContent = 'Expense removed.';
    renderExpenses();
    return;
  }

  if (action === 'edit') {
    editingExpenseId = expense.id;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseCategory').value = expense.category;
    expenseSubmitButton.textContent = 'Save expense';
    expenseMessage.textContent = 'Editing expense.';
  }
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

authForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    authMessage.textContent = 'Please enter your email and password.';
    return;
  }

  const users = readUsers();

  if (currentMode === 'register') {
    const name = nameInput.value.trim();

    if (!name) {
      authMessage.textContent = 'Please enter your name.';
      return;
    }

    if (users.some((user) => user.email === email)) {
      authMessage.textContent = 'An account with that email already exists.';
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    authMessage.textContent = `Welcome, ${name}! Your account has been created.`;
    authForm.reset();
    setMode('login');
    return;
  }

  const user = users.find((entry) => entry.email === email && entry.password === password);

  if (user) {
    authMessage.textContent = `Welcome back, ${user.name}!`;
    showExpensesView(user);
  } else {
    authMessage.textContent = 'Invalid email or password.';
  }
});

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentUser) {
    return;
  }

  const description = document.getElementById('expenseDescription').value.trim();
  const amount = document.getElementById('expenseAmount').value;
  const date = document.getElementById('expenseDate').value;
  const category = document.getElementById('expenseCategory').value;

  if (!description || !amount || !date) {
    expenseMessage.textContent = 'Please fill in all expense fields.';
    return;
  }

  const expenses = getExpensesForUser(currentUser.email);

  if (editingExpenseId) {
    const updatedExpenses = expenses.map((item) => item.id === editingExpenseId ? { ...item, description, amount, date, category } : item);
    saveExpensesForUser(currentUser.email, updatedExpenses);
    expenseMessage.textContent = 'Expense updated.';
  } else {
    expenses.push({
      id: `expense-${Date.now()}`,
      description,
      amount,
      date,
      category
    });
    saveExpensesForUser(currentUser.email, expenses);
    expenseMessage.textContent = 'Expense added.';
  }

  resetExpenseForm();
  renderExpenses();
});

logoutButton.addEventListener('click', () => {
  currentUser = null;
  editingExpenseId = null;
  expenseMessage.textContent = '';
  showAuthView();
});

expenseTableBody.addEventListener('click', handleExpenseAction);

setMode('login');
showAuthView();
